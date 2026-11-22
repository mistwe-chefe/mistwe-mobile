/* Gemeinsame Hilfsfunktionen des Workers */
import { b64uEncode } from './webpush.js';

export class HttpError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code || 'error'; }
}

export async function sha256b64(input) {
  const data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  return b64uEncode(await crypto.subtle.digest('SHA-256', data));
}

/** Zeitkonstanter Vergleich zweier Zeichenketten */
export function safeEqual(a, b) {
  a = String(a || ''); b = String(b || '');
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export function randomToken(bytes = 32) {
  return b64uEncode(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function readJson(request, maxBytes = 2 * 1024 * 1024) {
  const len = Number(request.headers.get('Content-Length') || 0);
  if (len > maxBytes) throw new HttpError(413, 'Anfrage zu groß');
  const text = await request.text();
  if (text.length > maxBytes) throw new HttpError(413, 'Anfrage zu groß');
  if (!text) return {};
  try { return JSON.parse(text); } catch (_) { throw new HttpError(400, 'Ungültiges JSON'); }
}

export const isId = v => typeof v === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(v);
export const isInt = v => Number.isInteger(v);
export const intOrNull = v => (v == null ? null : Number.isFinite(Number(v)) ? Math.round(Number(v)) : null);

/** Nächste Sequenznummer als SQL-Ausdruck (zusammen mit SEQ_INC in EINEM Batch verwenden) */
export const SEQ_INC = "UPDATE counters SET value = value + 1 WHERE name = 'seq'";
export const SEQ_VAL = "(SELECT value FROM counters WHERE name = 'seq')";
