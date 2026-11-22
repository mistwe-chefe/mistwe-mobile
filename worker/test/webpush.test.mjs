// Web Push: Verschlüsselung (RFC 8291) als Empfänger entschlüsseln, VAPID-JWT (RFC 8292) prüfen.
import assert from 'node:assert/strict';
import { encryptPayload, vapidJwt, b64uEncode, b64uDecode } from '../src/webpush.js';

const enc = new TextEncoder();
const hkdf = async (salt, ikm, info, len) => new Uint8Array(await crypto.subtle.deriveBits(
  { name: 'HKDF', hash: 'SHA-256', salt, info }, await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']), len * 8));
const cat = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };

// Empfänger (Browser) simulieren
const ua = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
const uaPub = new Uint8Array(await crypto.subtle.exportKey('raw', ua.publicKey));
const auth = crypto.getRandomValues(new Uint8Array(16));
const msg = JSON.stringify({ v: 1, type: 'reminders', items: [{ m: 'todos', id: 'x', t: 'äöü', n: 3 }] });

const body = await encryptPayload(msg, b64uEncode(uaPub), b64uEncode(auth));
const salt = body.slice(0, 16), rs = new DataView(body.buffer).getUint32(16), idlen = body[20];
const asPub = body.slice(21, 21 + idlen), ct = body.slice(21 + idlen);
assert.equal(rs, 4096); assert.equal(idlen, 65);
const asKey = await crypto.subtle.importKey('raw', asPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
const secret = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: asKey }, ua.privateKey, 256));
const ikm = await hkdf(auth, secret, cat(enc.encode('WebPush: info\0'), uaPub, asPub), 32);
const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);
const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['decrypt']), ct));
assert.equal(plain[plain.length - 1], 2);
assert.equal(new TextDecoder().decode(plain.slice(0, -1)), msg);
console.log('✓ RFC 8291: Nutzlast vom Empfänger entschlüsselbar');

// VAPID
const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const pub = b64uEncode(await crypto.subtle.exportKey('raw', kp.publicKey));
const priv = (await crypto.subtle.exportKey('jwk', kp.privateKey)).d;
const jwt = await vapidJwt('https://push.example.net', 'https://example.org/', pub, priv);
const [h, c, s] = jwt.split('.');
assert.deepEqual(JSON.parse(new TextDecoder().decode(b64uDecode(h))), { typ: 'JWT', alg: 'ES256' });
const claims = JSON.parse(new TextDecoder().decode(b64uDecode(c)));
assert.equal(claims.aud, 'https://push.example.net');
assert.ok(claims.exp - Date.now() / 1000 <= 24 * 3600);
assert.equal(b64uDecode(s).length, 64);
assert.ok(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, kp.publicKey, b64uDecode(s), enc.encode(`${h}.${c}`)));
assert.equal(await vapidJwt('https://push.example.net', 'x', pub, priv), jwt, 'JWT wird zwischengespeichert');
console.log('✓ RFC 8292: VAPID-JWT gültig signiert');
console.log('Alle Web-Push-Tests bestanden.');
