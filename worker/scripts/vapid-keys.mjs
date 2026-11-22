// Erzeugt einmalig das VAPID-Schlüsselpaar (P-256) für Web Push.
// Aufruf: node scripts/vapid-keys.mjs
// Öffentlicher Schlüssel → wrangler.jsonc (VAPID_PUBLIC_KEY)
// Privater Schlüssel     → npx wrangler secret put VAPID_PRIVATE_KEY  (NIE ins Repo!)
const b64u = buf => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const pub = await crypto.subtle.exportKey('raw', kp.publicKey);
const jwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
console.log('VAPID_PUBLIC_KEY  (öffentlich, in wrangler.jsonc eintragen):');
console.log(b64u(pub));
console.log('');
console.log('VAPID_PRIVATE_KEY (GEHEIM, nur per `npx wrangler secret put VAPID_PRIVATE_KEY` setzen):');
console.log(jwk.d);
