/* Synchronisation verschlüsselter Datensätze und Erinnerungsdaten (Architektur 9) */
import { HttpError, readJson, isId, intOrNull, SEQ_INC, SEQ_VAL } from './util.js';
import { STAGES } from './schedule.js';

const PAGE = 300;
const MAX_UPLOAD = 200;

export const itemOut = r => ({ module: r.module, collection: r.collection, id: r.id, schema: r.schema, updatedAt: r.updated_at, deleted: !!r.deleted, payload: r.payload, seq: r.seq });
export const reminderOut = r => ({
  module: r.module, itemId: r.item_id, stage: r.stage, stageMin: r.stage_min, deadline: r.deadline, overdueMin: r.overdue_min,
  nextAt: r.next_at, done: !!r.done, deleted: !!r.deleted, titleEnc: r.title_enc, lastSentAt: r.last_sent_at, sentCount: r.sent_count,
  updatedAt: r.updated_at, seq: r.seq,
});

/** GET /v1/sync?since=<seq> */
export async function pull(url, env) {
  const since = Math.max(0, Number(url.searchParams.get('since')) || 0);
  const [it, rem] = await Promise.all([
    env.DB.prepare('SELECT * FROM items WHERE seq > ? ORDER BY seq LIMIT ?').bind(since, PAGE).all(),
    env.DB.prepare('SELECT * FROM reminders WHERE seq > ? ORDER BY seq LIMIT ?').bind(since, PAGE).all(),
  ]);
  let items = it.results, reminders = rem.results;
  let more = false;
  // Beide Tabellen teilen sich einen Zähler: bei vollen Seiten nur bis zur kleineren Obergrenze liefern
  let limit = Infinity;
  if (items.length === PAGE) { limit = Math.min(limit, items[items.length - 1].seq); more = true; }
  if (reminders.length === PAGE) { limit = Math.min(limit, reminders[reminders.length - 1].seq); more = true; }
  if (limit !== Infinity) { items = items.filter(r => r.seq <= limit); reminders = reminders.filter(r => r.seq <= limit); }
  let cursor = since;
  for (const r of items) cursor = Math.max(cursor, r.seq);
  for (const r of reminders) cursor = Math.max(cursor, r.seq);
  if (!more) {
    const c = await env.DB.prepare("SELECT value FROM counters WHERE name = 'seq'").first();
    cursor = Math.max(cursor, c?.value || 0);
  }
  return { items: items.map(itemOut), reminders: reminders.map(reminderOut), cursor, more };
}

function checkItem(x) {
  if (!x || !isId(x.module) || !isId(x.collection) || !isId(x.id)) throw new HttpError(400, 'Datensatz: ungültige ID');
  if (!Number.isInteger(x.schema) || x.schema < 1) throw new HttpError(400, 'Datensatz: schema fehlt');
  if (!Number.isFinite(x.updatedAt)) throw new HttpError(400, 'Datensatz: updatedAt fehlt');
  if (typeof x.payload !== 'string' || x.payload.length > 256 * 1024) throw new HttpError(400, 'Datensatz: payload ungültig');
}
function checkReminder(x) {
  if (!x || !isId(x.module) || !isId(x.itemId)) throw new HttpError(400, 'Erinnerung: ungültige ID');
  if (!Number.isFinite(x.updatedAt)) throw new HttpError(400, 'Erinnerung: updatedAt fehlt');
  if (x.titleEnc != null && (typeof x.titleEnc !== 'string' || x.titleEnc.length > 2000)) throw new HttpError(400, 'Erinnerung: titleEnc zu lang');
}

/** POST /v1/sync { items: [...], reminders: [...] } */
export async function push(request, env) {
  const b = await readJson(request, 8 * 1024 * 1024);
  const items = Array.isArray(b.items) ? b.items : [];
  const reminders = Array.isArray(b.reminders) ? b.reminders : [];
  if (items.length + reminders.length > MAX_UPLOAD) throw new HttpError(413, `Höchstens ${MAX_UPLOAD} Einträge je Aufruf`);
  items.forEach(checkItem); reminders.forEach(checkReminder);

  const stmts = [];
  const kinds = [];
  for (const x of items) {
    stmts.push(env.DB.prepare(SEQ_INC));
    stmts.push(env.DB.prepare(
      `INSERT INTO items (module, collection, id, schema, updated_at, deleted, payload, seq) VALUES (?, ?, ?, ?, ?, ?, ?, ${SEQ_VAL})
       ON CONFLICT(module, collection, id) DO UPDATE SET schema = excluded.schema, updated_at = excluded.updated_at,
         deleted = excluded.deleted, payload = excluded.payload, seq = excluded.seq
       WHERE excluded.updated_at > items.updated_at OR (excluded.updated_at = items.updated_at AND excluded.schema > items.schema)`)
      .bind(x.module, x.collection, x.id, x.schema, Math.round(x.updatedAt), x.deleted ? 1 : 0, x.payload));
    kinds.push(['item', x]);
  }
  for (const x of reminders) {
    const stageMin = intOrNull(x.stageMin) || STAGES[x.stage] || 1440;
    stmts.push(env.DB.prepare(SEQ_INC));
    // Felder, die der Cron pflegt (last_sent_at, sent_count), werden zusammengeführt statt überschrieben.
    // Ein vom Gerät gemeldetes next_at, das der Server bereits abgearbeitet hat, ersetzt das neuere des Servers nicht.
    stmts.push(env.DB.prepare(
      `INSERT INTO reminders (module, item_id, stage, stage_min, deadline, overdue_min, next_at, done, deleted, title_enc, last_sent_at, sent_count, updated_at, seq)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${SEQ_VAL})
       ON CONFLICT(module, item_id) DO UPDATE SET
         stage = excluded.stage, stage_min = excluded.stage_min, deadline = excluded.deadline, overdue_min = excluded.overdue_min,
         done = excluded.done, deleted = excluded.deleted, title_enc = excluded.title_enc,
         next_at = CASE WHEN excluded.done = 0 AND excluded.next_at IS NOT NULL AND reminders.last_sent_at IS NOT NULL
                          AND excluded.next_at <= reminders.last_sent_at AND COALESCE(excluded.last_sent_at, 0) < reminders.last_sent_at
                        THEN reminders.next_at ELSE excluded.next_at END,
         last_sent_at = MAX(COALESCE(excluded.last_sent_at, 0), COALESCE(reminders.last_sent_at, 0)),
         sent_count = MAX(excluded.sent_count, reminders.sent_count),
         updated_at = excluded.updated_at, seq = excluded.seq
       WHERE excluded.updated_at > reminders.updated_at`)
      .bind(x.module, x.itemId, typeof x.stage === 'string' ? x.stage.slice(0, 16) : null, stageMin, intOrNull(x.deadline),
        intOrNull(x.overdueMin) || 15, x.done || x.deleted ? null : intOrNull(x.nextAt), x.done ? 1 : 0, x.deleted ? 1 : 0,
        x.titleEnc ?? null, intOrNull(x.lastSentAt), intOrNull(x.sentCount) || 0, Math.round(x.updatedAt)));
    kinds.push(['reminder', x]);
  }

  const res = stmts.length ? await env.DB.batch(stmts) : [];
  let accepted = 0;
  const rejItems = [], rejRem = [];
  kinds.forEach(([kind, x], i) => {
    const changes = res[i * 2 + 1]?.meta?.changes || 0;
    if (changes > 0) accepted++;
    else if (kind === 'item') rejItems.push(x); else rejRem.push(x);
  });
  // Abgelehnte: aktuellen Server-Stand mitliefern, damit das Gerät zusammenführen kann
  const rejected = { items: [], reminders: [] };
  for (const x of rejItems) {
    const r = await env.DB.prepare('SELECT * FROM items WHERE module = ? AND collection = ? AND id = ?').bind(x.module, x.collection, x.id).first();
    if (r) rejected.items.push(itemOut(r));
  }
  for (const x of rejRem) {
    const r = await env.DB.prepare('SELECT * FROM reminders WHERE module = ? AND item_id = ?').bind(x.module, x.itemId).first();
    if (r) rejected.reminders.push(reminderOut(r));
  }
  return { accepted, rejected };
}

/** POST /v1/reminders/{module}/{id}/ack { action: "done" | "snooze", snoozeMin } */
export async function ack(request, env, module, id) {
  if (!isId(module) || !isId(id)) throw new HttpError(400, 'Ungültige ID');
  const b = await readJson(request);
  const now = Date.now();
  let set;
  if (b.action === 'done') set = 'done = 1, next_at = NULL';
  else if (b.action === 'snooze') {
    const min = Math.min(Math.max(Number(b.snoozeMin) || 60, 1), 7 * 1440);
    set = `next_at = ${now + Math.round(min) * 60000}`;
  } else throw new HttpError(400, 'Unbekannte Aktion');
  const res = await env.DB.batch([
    env.DB.prepare(SEQ_INC),
    env.DB.prepare(`UPDATE reminders SET ${set}, updated_at = MAX(?, updated_at + 1), seq = ${SEQ_VAL} WHERE module = ? AND item_id = ?`).bind(now, module, id),
  ]);
  return { ok: (res[1]?.meta?.changes || 0) > 0 };
}

/** PUT /v1/settings { timezone, quietStart, quietEnd, breakForDeadline } */
export async function putSettings(request, env) {
  const b = await readJson(request);
  let tz = typeof b.timezone === 'string' ? b.timezone.slice(0, 64) : 'Europe/Berlin';
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); } catch (_) { tz = 'Europe/Berlin'; }
  const mm = v => (Number.isInteger(v) && v >= 0 && v < 1440 ? v : null);
  await env.DB.prepare('UPDATE account SET timezone = ?, quiet_start = ?, quiet_end = ?, break_deadline = ? WHERE id = 1')
    .bind(tz, mm(b.quietStart), mm(b.quietEnd), b.breakForDeadline ? 1 : 0).run();
  return { ok: true };
}

/** PUT /v1/subscription { endpoint, keys: { p256dh, auth } } */
export async function putSubscription(request, env, dev) {
  const b = await readJson(request);
  let ep;
  try { ep = new URL(b.endpoint); } catch (_) { throw new HttpError(400, 'endpoint ungültig'); }
  if (ep.protocol !== 'https:' && !env.ALLOW_HTTP_PUSH) throw new HttpError(400, 'endpoint muss https sein');
  const k = b.keys || {};
  if (typeof k.p256dh !== 'string' || typeof k.auth !== 'string' || k.p256dh.length > 200 || k.auth.length > 64) throw new HttpError(400, 'keys ungültig');
  // Ein Gerät (Browser) hat genau ein gültiges Abo: ältere desselben Geräts sind verworfen und werden entfernt
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO subscriptions (endpoint, device_id, p256dh, auth, created_at, fail_count) VALUES (?, ?, ?, ?, ?, 0)
       ON CONFLICT(endpoint) DO UPDATE SET device_id = excluded.device_id, p256dh = excluded.p256dh, auth = excluded.auth, fail_count = 0`)
      .bind(b.endpoint, dev.id, k.p256dh, k.auth, Date.now()),
    env.DB.prepare('DELETE FROM subscriptions WHERE device_id = ? AND endpoint <> ?').bind(dev.id, b.endpoint),
  ]);
  return { ok: true };
}

export async function deleteSubscription(request, env, dev) {
  const b = await readJson(request);
  if (b.endpoint) await env.DB.prepare('DELETE FROM subscriptions WHERE endpoint = ? AND device_id = ?').bind(b.endpoint, dev.id).run();
  else await env.DB.prepare('DELETE FROM subscriptions WHERE device_id = ?').bind(dev.id).run();
  return { ok: true };
}
