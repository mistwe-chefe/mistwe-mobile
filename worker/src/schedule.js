/* Erinnerungsregel – identisch zu index.html (Kern: Schedule). Ab 1.15.0 ohne Eskalation.
 * Änderungen IMMER an beiden Stellen und gegen die Testtabelle (test/schedule.test.mjs) prüfen.
 */

export const STAGES = {
  '1m': 1, '30m': 30, '90m': 90, '3h': 180, '6h': 360, '1d': 1440, '3d': 4320, '1w': 10080, '2w': 20160, '1mo': 43200,
};

/** Ab 1.15.0 ohne Eskalation: immer das gewählte Intervall. deadline/overdueMin werden ignoriert (API bleibt kompatibel). */
export function nextInterval(stageMin) {
  return Math.max(1, stageMin || 1440);
}

export function nextAt(r, now) {
  return now + nextInterval(r.stageMin) * 60000;
}

/** Minuten nach Mitternacht in einer Zeitzone */
export function localMinutes(now, timeZone) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(now));
    const h = Number(parts.find(p => p.type === 'hour').value), m = Number(parts.find(p => p.type === 'minute').value);
    return h * 60 + m;
  } catch (_) {
    const d = new Date(now); return d.getUTCHours() * 60 + d.getUTCMinutes();
  }
}

/** Ende der Ruhezeit, falls `now` darin liegt, sonst null */
export function quietEnd(now, start, end, timeZone) {
  if (start == null || end == null || start === end) return null;
  const m = localMinutes(now, timeZone);
  const active = start < end ? (m >= start && m < end) : (m >= start || m < end);
  if (!active) return null;
  const delta = (end - m + 1440) % 1440 || 1440;
  const minuteStart = now - (now % 60000);
  return minuteStart + delta * 60000;
}

/** Verschiebung wegen Ruhezeit (oder null = jetzt senden). q = { enabled, start, end, timeZone } */
export function quietDefer(now, r, q) {
  if (!q || !q.enabled) return null;
  const end = quietEnd(now, q.start, q.end, q.timeZone);
  if (end == null) return null;
  return end;
}
