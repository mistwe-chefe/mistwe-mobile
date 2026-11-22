/* Web Push ohne Fremdbibliothek (Architektur 8.4, ADR-14)
 * - Nutzlast-Verschlüsselung nach RFC 8291 (Content-Encoding: aes128gcm, RFC 8188)
 * - VAPID nach RFC 8292 (JWT, ES256)
 */

const enc = new TextEncoder();

export function b64uEncode(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64uDecode(str) {
  const s = String(str).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function concat(...parts) {
  const len = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

async function hkdf(salt, ikm, info, length) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length * 8));
}

/** Öffentlichen P-256-Punkt (65 Byte, unkomprimiert) in JWK-Koordinaten zerlegen */
function pointToJwk(raw) {
  if (raw.length !== 65 || raw[0] !== 4) throw new Error('Ungültiger P-256-Schlüssel');
  return { kty: 'EC', crv: 'P-256', x: b64uEncode(raw.slice(1, 33)), y: b64uEncode(raw.slice(33, 65)) };
}

/**
 * Verschlüsselt `plaintext` für ein Push-Abo (RFC 8291).
 * opts.asKeyPair / opts.salt nur für Tests (feste Werte).
 */
export async function encryptPayload(plaintext, p256dhB64, authB64, opts = {}) {
  const uaPublic = b64uDecode(p256dhB64);
  const authSecret = b64uDecode(authB64);
  const data = typeof plaintext === 'string' ? enc.encode(plaintext) : plaintext;

  const asKeys = opts.asKeyPair || await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', asKeys.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdhSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, asKeys.privateKey, 256));

  const keyInfo = concat(enc.encode('WebPush: info\0'), uaPublic, asPublic);
  const ikm = await hkdf(authSecret, ecdhSecret, keyInfo, 32);
  const salt = opts.salt || crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);

  const record = concat(data, new Uint8Array([2])); // Begrenzer: letzter Datensatz, kein Padding
  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, record));

  const rs = 4096;
  const header = new Uint8Array(16 + 4 + 1 + asPublic.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, rs);
  header[20] = asPublic.length;
  header.set(asPublic, 21);
  return concat(header, ct);
}

/* ---------- VAPID (RFC 8292) ---------- */
const jwtCache = new Map(); // audience → { jwt, exp }
let signingKey = null, signingKeyId = null;

async function getSigningKey(publicKeyB64, privateKeyB64) {
  const id = publicKeyB64 + '|' + privateKeyB64.slice(0, 6);
  if (signingKey && signingKeyId === id) return signingKey;
  const jwk = { ...pointToJwk(b64uDecode(publicKeyB64)), d: privateKeyB64, ext: false };
  signingKey = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  signingKeyId = id;
  return signingKey;
}

export async function vapidJwt(audience, subject, publicKeyB64, privateKeyB64, now = Date.now()) {
  const cached = jwtCache.get(audience);
  if (cached && cached.exp - now / 1000 > 3600) return cached.jwt;
  const exp = Math.floor(now / 1000) + 12 * 3600; // 12 Stunden (Maximum laut RFC: 24 h)
  const header = b64uEncode(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64uEncode(enc.encode(JSON.stringify({ aud: audience, exp, sub: subject })));
  const unsigned = `${header}.${claims}`;
  const key = await getSigningKey(publicKeyB64, privateKeyB64);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(unsigned)));
  const jwt = `${unsigned}.${b64uEncode(sig)}`; // Web Crypto liefert bereits r||s (64 Byte)
  jwtCache.set(audience, { jwt, exp });
  return jwt;
}

/**
 * Sendet einen Push. sub = { endpoint, p256dh, auth }, vapid = { publicKey, privateKey, subject }
 * Ergebnis: { ok, status, gone }
 */
export async function sendPush(sub, payload, vapid, { ttl = 3600, urgency = 'high', topic } = {}) {
  const body = await encryptPayload(JSON.stringify(payload), sub.p256dh, sub.auth);
  const audience = new URL(sub.endpoint).origin;
  const jwt = await vapidJwt(audience, vapid.subject, vapid.publicKey, vapid.privateKey);
  const headers = {
    'Content-Type': 'application/octet-stream',
    'Content-Encoding': 'aes128gcm',
    TTL: String(ttl),
    Urgency: urgency,
    Authorization: `vapid t=${jwt}, k=${vapid.publicKey}`,
  };
  if (topic) headers.Topic = topic;
  let res;
  try { res = await fetch(sub.endpoint, { method: 'POST', headers, body }); }
  catch (e) { return { ok: false, status: 0, gone: false, reason: 'Netzwerk: ' + e.message }; }
  const ok = res.status >= 200 && res.status < 300;
  let reason = '';
  if (!ok) { try { const t = await res.text(); try { reason = JSON.parse(t).reason || t; } catch (_) { reason = t; } } catch (_) {} }
  return { ok, status: res.status, gone: res.status === 404 || res.status === 410, reason: String(reason || '').slice(0, 200) };
}
