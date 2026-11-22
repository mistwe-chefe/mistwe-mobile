/* Persönliche App – Push- und Sync-Dienst (Cloudflare Worker)
 * REST-API /v1 (Architektur 8.6) und Cron jede Minute (8.5).
 */
import { HttpError, SEQ_INC, SEQ_VAL } from './util.js';
import { getConfig, getKdf, setup, login, authenticate, listDevices, deleteDevice, rekey } from './auth.js';
import { pull, push, ack, putSettings, putSubscription, deleteSubscription } from './sync.js';
import { nextAt, quietDefer } from './schedule.js';
import { sendPush } from './webpush.js';

const WORKER_VERSION = '1.1.0';

/* ---------- HTTP ---------- */
function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  const list = String(env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
  return origin && list.includes(origin) ? origin : null;
}

function cors(request, env) {
  const o = allowedOrigin(request, env);
  if (!o) return {};
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

const json = (data, status, headers) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
});

async function route(request, env) {
  const url = new URL(request.url);
  const p = url.pathname.replace(/\/+$/, '');
  const M = request.method;

  if (M === 'GET' && (p === '' || p === '/')) return { name: 'pa-push', version: WORKER_VERSION, api: '/v1' };
  if (M === 'GET' && p === '/v1/config') return getConfig(env);
  if (M === 'GET' && p === '/v1/kdf') return getKdf(env);
  if (M === 'POST' && p === '/v1/setup') return setup(request, env);
  if (M === 'POST' && p === '/v1/login') return login(request, env);

  const dev = await authenticate(request, env);
  if (M === 'GET' && p === '/v1/sync') return pull(url, env);
  if (M === 'POST' && p === '/v1/sync') return push(request, env);
  if (M === 'GET' && p === '/v1/devices') return listDevices(env, dev);
  let m;
  if (M === 'DELETE' && (m = /^\/v1\/devices\/([A-Za-z0-9-]{1,64})$/.exec(p))) return deleteDevice(env, m[1]);
  if (M === 'PUT' && p === '/v1/subscription') return putSubscription(request, env, dev);
  if (M === 'DELETE' && p === '/v1/subscription') return deleteSubscription(request, env, dev);
  if (M === 'POST' && (m = /^\/v1\/reminders\/([^/]+)\/([^/]+)\/ack$/.exec(p))) return ack(request, env, decodeURIComponent(m[1]), decodeURIComponent(m[2]));
  if (M === 'PUT' && p === '/v1/settings') return putSettings(request, env);
  if (M === 'POST' && p === '/v1/test-push') return testPush(env, dev);
  if (M === 'POST' && p === '/v1/account/rekey') return rekey(request, env, dev);
  if (M === 'GET' && p === '/v1/status') return status(env, dev);
  throw new HttpError(404, 'Unbekannte Route', 'not_found');
}

/* ---------- Push-Versand ---------- */
function vapid(env) {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) throw new HttpError(500, 'VAPID-Schlüssel fehlen im Worker', 'misconfigured');
  // VAPID_CONTACT (Secret, z. B. mailto:…) hat Vorrang – so steht keine E-Mail-Adresse im Repo
  return { publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY, subject: env.VAPID_CONTACT || env.VAPID_SUBJECT || 'mailto:admin@example.invalid' };
}

async function sendToAll(env, payload, { where = '', bind = [] } = {}) {
  const { results: subs } = await env.DB.prepare(`SELECT * FROM subscriptions ${where}`).bind(...bind).all();
  const v = vapid(env);
  const out = await Promise.all(subs.map(async s => ({ s, r: await sendPush(s, payload, v, { topic: 'pa-reminders' }) })));
  const stmts = [], diag = [];
  const now = Date.now();
  let sent = 0;
  for (const { s, r } of out) {
    diag.push(env.DB.prepare('UPDATE subscriptions SET last_status = ?, last_reason = ?, last_at = ? WHERE endpoint = ?').bind(r.status, r.reason || null, now, s.endpoint));
    if (r.ok) { sent++; if (s.fail_count) stmts.push(env.DB.prepare('UPDATE subscriptions SET fail_count = 0 WHERE endpoint = ?').bind(s.endpoint)); }
    else if (r.gone || s.fail_count + 1 >= 20) stmts.push(env.DB.prepare('DELETE FROM subscriptions WHERE endpoint = ?').bind(s.endpoint));
    else stmts.push(env.DB.prepare('UPDATE subscriptions SET fail_count = fail_count + 1 WHERE endpoint = ?').bind(s.endpoint));
    if (!r.ok) console.warn(`Push an ${new URL(s.endpoint).host} fehlgeschlagen: ${r.status} ${r.reason || ''}`);
  }
  if (stmts.length) await env.DB.batch(stmts);
  // Diagnose getrennt schreiben: fehlt Migration 0002, darf das den Versand nicht stören
  if (diag.length) await env.DB.batch(diag).catch(e => console.warn('Diagnose nicht gespeichert (Migration 0002 angewendet?): ' + e.message));
  const results = out.map(({ s, r }) => ({ host: new URL(s.endpoint).host, device: s.device_id, status: r.status, ok: r.ok, reason: r.reason || '' }));
  return { sent, total: subs.length, results };
}

/** GET /v1/status – Diagnose: Cron-Takt und letzter Versand an dieses Gerät */
async function status(env, dev) {
  const c = await env.DB.prepare("SELECT value FROM counters WHERE name = 'cron_at'").first();
  let results, migrationMissing = false;
  try { ({ results } = await env.DB.prepare('SELECT endpoint, created_at, fail_count, last_status, last_reason, last_at FROM subscriptions WHERE device_id = ?').bind(dev.id).all()); }
  catch (_) { migrationMissing = true; ({ results } = await env.DB.prepare('SELECT endpoint, created_at, fail_count FROM subscriptions WHERE device_id = ?').bind(dev.id).all()); }
  const subject = String(env.VAPID_CONTACT || env.VAPID_SUBJECT || '');
  return {
    workerVersion: WORKER_VERSION, now: Date.now(), cronAt: c && c.value ? c.value : null, migrationMissing,
    vapidSubject: subject.startsWith('mailto:') ? 'mailto' : subject.startsWith('https:') ? 'https' : 'ungültig',
    subscriptions: results.map(s => ({ host: new URL(s.endpoint).host, endpointTail: s.endpoint.slice(-8), createdAt: s.created_at, failCount: s.fail_count, lastStatus: s.last_status, lastReason: s.last_reason, lastAt: s.last_at })),
  };
}

async function testPush(env, dev) {
  const r = await sendToAll(env, { v: 1, type: 'test', from: dev.name || '' });
  return r;
}

/** Nutzlast auf ca. 3 KB begrenzen (Architektur 8.4) */
function buildPayload(list) {
  const payload = { v: 1, type: 'reminders', items: [], more: 0 };
  for (const x of list) {
    payload.items.push(x);
    if (JSON.stringify(payload).length > 3000) { payload.items.pop(); payload.more = list.length - payload.items.length; break; }
  }
  return payload;
}

/* ---------- Cron (jede Minute) ---------- */
async function runCron(env, now = Date.now()) {
  await env.DB.prepare("UPDATE counters SET value = ? WHERE name = 'cron_at'").bind(now).run().catch(() => {});
  const acc = await env.DB.prepare('SELECT * FROM account WHERE id = 1').first();
  if (!acc) return { due: 0, sent: 0 };
  const { results: due } = await env.DB.prepare(
    'SELECT * FROM reminders WHERE done = 0 AND deleted = 0 AND next_at IS NOT NULL AND next_at <= ? ORDER BY next_at LIMIT 100').bind(now).all();
  if (!due.length) return { due: 0, sent: 0 };

  const q = { enabled: acc.quiet_start != null && acc.quiet_end != null, start: acc.quiet_start, end: acc.quiet_end, breakForDeadline: !!acc.break_deadline, timeZone: acc.timezone };
  const stmts = [], plan = [];
  for (const r of due) {
    const rr = { stageMin: r.stage_min, deadline: r.deadline, overdueMin: r.overdue_min };
    const qEnd = quietDefer(now, rr, q);
    let upd;
    if (qEnd) {
      upd = env.DB.prepare(`UPDATE reminders SET next_at = ?, seq = ${SEQ_VAL} WHERE module = ? AND item_id = ? AND next_at = ? AND done = 0`)
        .bind(qEnd, r.module, r.item_id, r.next_at);
      plan.push(null);
    } else {
      const atDeadline = !!r.deadline && r.next_at === r.deadline;
      const next = nextAt(rr, now);
      upd = env.DB.prepare(`UPDATE reminders SET next_at = ?, last_sent_at = ?, sent_count = sent_count + 1, seq = ${SEQ_VAL}
                            WHERE module = ? AND item_id = ? AND next_at = ? AND done = 0`)
        .bind(next, now, r.module, r.item_id, r.next_at);
      plan.push({ m: r.module, id: r.item_id, t: r.title_enc || null, dl: r.deadline || null, n: r.sent_count + 1, at: atDeadline ? 1 : 0 });
    }
    stmts.push(env.DB.prepare(SEQ_INC), upd);
  }
  const res = await env.DB.batch(stmts);
  // Nur senden, was dieser Lauf tatsächlich geändert hat (Schutz vor doppelten Läufen)
  const toSend = plan.filter((x, i) => x && (res[i * 2 + 1]?.meta?.changes || 0) > 0);
  if (!toSend.length) return { due: due.length, sent: 0 };
  let result = { sent: 0, total: 0 };
  try { result = await sendToAll(env, buildPayload(toSend)); }
  catch (e) { console.error('Push-Versand: ' + e.message); }
  return { due: due.length, reminders: toSend.length, ...result };
}

export default {
  async fetch(request, env) {
    const h = cors(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    try {
      return json(await route(request, env), 200, h);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.code, message: e.message }, e.status, h);
      console.error(e && e.stack || e);
      return json({ error: 'internal', message: 'Interner Fehler' }, 500, h);
    }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runCron(env, Date.now()).then(r => { if (r.sent || r.due) console.log('Cron', JSON.stringify(r)); }));
  },
};
