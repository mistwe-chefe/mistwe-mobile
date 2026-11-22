/* Einrichtung, Anmeldung, Geräte-Token (Architektur 8.3) */
import { HttpError, sha256b64, safeEqual, randomToken, readJson } from './util.js';
import { b64uDecode } from './webpush.js';

const MAX_FAILED_PER_HOUR = 10;

async function account(env) {
  return env.DB.prepare('SELECT * FROM account WHERE id = 1').first();
}

async function throttle(env) {
  const since = Date.now() - 3600000;
  await env.DB.prepare('DELETE FROM login_attempts WHERE ts < ?').bind(since).run();
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM login_attempts WHERE ts >= ?').bind(since).first();
  if ((row?.n || 0) >= MAX_FAILED_PER_HOUR) throw new HttpError(429, 'Zu viele Fehlversuche. Bitte in einer Stunde erneut versuchen.', 'throttled');
}
const failed = env => env.DB.prepare('INSERT INTO login_attempts (ts) VALUES (?)').bind(Date.now()).run();

async function createDevice(env, name) {
  const id = crypto.randomUUID();
  const token = randomToken(32);
  const now = Date.now();
  await env.DB.prepare('INSERT INTO devices (id, token_hash, name, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?)')
    .bind(id, await sha256b64(token), String(name || 'Gerät').slice(0, 60), now, now).run();
  return { deviceId: id, deviceToken: token };
}

function validKdf(b) {
  if (typeof b.kdfSalt !== 'string' || b.kdfSalt.length < 16 || b.kdfSalt.length > 64) throw new HttpError(400, 'kdfSalt ungültig');
  if (!Number.isInteger(b.kdfIter) || b.kdfIter < 100000 || b.kdfIter > 10000000) throw new HttpError(400, 'kdfIter ungültig');
  if (typeof b.authHash !== 'string' || b.authHash.length !== 43) throw new HttpError(400, 'authHash ungültig');
}

export async function getConfig(env) {
  const acc = await account(env);
  return { apiVersion: 1, vapidPublicKey: env.VAPID_PUBLIC_KEY || null, accountExists: !!acc };
}

export async function getKdf(env) {
  const acc = await account(env);
  if (!acc) throw new HttpError(404, 'Noch kein Konto eingerichtet', 'no_account');
  return { kdfSalt: acc.kdf_salt, kdfIter: acc.kdf_iter };
}

/** POST /v1/setup – Konto + erstes Gerät. Mit reset:true wird ein bestehendes Konto samt Server-Daten ersetzt. */
export async function setup(request, env) {
  const b = await readJson(request);
  await throttle(env);
  if (!env.SETUP_SECRET) throw new HttpError(500, 'SETUP_SECRET ist im Worker nicht gesetzt', 'misconfigured');
  if (!safeEqual(b.setupSecret, env.SETUP_SECRET)) { await failed(env); throw new HttpError(403, 'Einrichtungs-Code falsch', 'bad_secret'); }
  validKdf(b);
  const acc = await account(env);
  if (acc && !b.reset) throw new HttpError(409, 'Es gibt bereits ein Konto. Mit bestehendem Konto verbinden oder Konto zurücksetzen.', 'account_exists');
  const now = Date.now();
  const stmts = [];
  if (acc) {
    for (const t of ['subscriptions', 'devices', 'items', 'reminders', 'account']) stmts.push(env.DB.prepare(`DELETE FROM ${t}`));
  }
  stmts.push(env.DB.prepare('INSERT INTO account (id, auth_hash, kdf_salt, kdf_iter, created_at) VALUES (1, ?, ?, ?, ?)').bind(b.authHash, b.kdfSalt, b.kdfIter, now));
  await env.DB.batch(stmts);
  return createDevice(env, b.deviceName);
}

/** POST /v1/login – weiteres Gerät mit dem Sync-Passwort anmelden */
export async function login(request, env) {
  const b = await readJson(request);
  await throttle(env);
  const acc = await account(env);
  if (!acc) throw new HttpError(404, 'Noch kein Konto eingerichtet', 'no_account');
  if (typeof b.loginKey !== 'string' || b.loginKey.length > 100) throw new HttpError(400, 'loginKey fehlt');
  let hash;
  try { hash = await sha256b64(b64uDecode(b.loginKey)); }
  catch (_) { throw new HttpError(400, 'loginKey ungültig'); }
  if (!safeEqual(hash, acc.auth_hash)) { await failed(env); throw new HttpError(403, 'Sync-Passwort falsch', 'bad_password'); }
  return createDevice(env, b.deviceName);
}

/** Bearer-Token prüfen → Gerät */
export async function authenticate(request, env) {
  const m = /^Bearer\s+([A-Za-z0-9_-]{20,100})$/.exec(request.headers.get('Authorization') || '');
  if (!m) throw new HttpError(401, 'Nicht angemeldet', 'unauthorized');
  const dev = await env.DB.prepare('SELECT * FROM devices WHERE token_hash = ?').bind(await sha256b64(m[1])).first();
  if (!dev) throw new HttpError(401, 'Gerät ist nicht (mehr) angemeldet', 'unauthorized');
  const now = Date.now();
  if (!dev.last_seen_at || now - dev.last_seen_at > 5 * 60000) {
    await env.DB.prepare('UPDATE devices SET last_seen_at = ? WHERE id = ?').bind(now, dev.id).run();
  }
  return dev;
}

export async function listDevices(env, dev) {
  const { results } = await env.DB.prepare(
    'SELECT d.id, d.name, d.created_at, d.last_seen_at, (SELECT COUNT(*) FROM subscriptions s WHERE s.device_id = d.id) AS subs FROM devices d ORDER BY d.created_at').all();
  return { devices: results.map(d => ({ id: d.id, name: d.name, createdAt: d.created_at, lastSeenAt: d.last_seen_at, push: d.subs > 0, current: d.id === dev.id })) };
}

export async function deleteDevice(env, id) {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM subscriptions WHERE device_id = ?').bind(id),
    env.DB.prepare('DELETE FROM devices WHERE id = ?').bind(id),
  ]);
  return { ok: true };
}

/** POST /v1/account/rekey – Sync-Passwort ändern.
 *  Prüft den bisherigen Login-Schlüssel, setzt neuen Salt/Hash, meldet alle anderen Geräte ab
 *  und leert die (mit dem alten Schlüssel verschlüsselte) Server-Kopie. Das aufrufende Gerät lädt danach alles neu hoch. */
export async function rekey(request, env, dev) {
  const b = await readJson(request);
  await throttle(env);
  const acc = await account(env);
  if (!acc) throw new HttpError(404, 'Kein Konto', 'no_account');
  const old = typeof b.loginKey === 'string' ? b.loginKey : '';
  let hash = '';
  try { hash = await sha256b64(b64uDecode(old)); } catch (_) {}
  if (!safeEqual(hash, acc.auth_hash)) { await failed(env); throw new HttpError(403, 'Bisheriges Sync-Passwort falsch', 'bad_password'); }
  validKdf(b);
  await env.DB.batch([
    env.DB.prepare('UPDATE account SET auth_hash = ?, kdf_salt = ?, kdf_iter = ? WHERE id = 1').bind(b.authHash, b.kdfSalt, b.kdfIter),
    env.DB.prepare('DELETE FROM subscriptions WHERE device_id <> ?').bind(dev.id),
    env.DB.prepare('DELETE FROM devices WHERE id <> ?').bind(dev.id),
    env.DB.prepare('DELETE FROM items'),
    env.DB.prepare('DELETE FROM reminders'),
  ]);
  const c = await env.DB.prepare("SELECT value FROM counters WHERE name = 'seq'").first();
  return { ok: true, cursor: c?.value || 0 };
}
