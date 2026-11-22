/* Eskalationsregel – identisch zu index.html (Kern: Schedule), Architektur 10.2.
 * Änderungen IMMER an beiden Stellen und gegen die Testtabelle (test/schedule.test.mjs) prüfen.
 */

export const DEADLINE_STEPS = [5, 10, 15, 30, 60, 90, 180, 360, 720, 1440, 4320, 10080]; // Minuten

export const STAGES = {
  '30m': 30, '90m': 90, '3h': 180, '6h': 360, '1d': 1440, '3d': 4320, '1w': 10080, '2w': 20160, '1mo': 43200,
};

export function nextInterval(stageMin, deadline, overdueMin, now) {
  if (!deadline) return stageMin;
  const remainingMin = (deadline - now) / 60000;
  if (remainingMin <= 0) return overdueMin || 15;
  const target = remainingMin / 4;
  let step = 5;
  for (const s of DEADLINE_STEPS) if (s <= target) step = s;
  return Math.min(stageMin, step);
}

export function nextAt(r, now) {
  let t = now + nextInterval(r.stageMin, r.deadline, r.overdueMin, now) * 60000;
  if (r.deadline && now < r.deadline && t > r.deadline) t = r.deadline;
  return t;
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

/** Verschiebung wegen Ruhezeit (oder null = jetzt senden). q = { enabled, start, end, breakForDeadline, timeZone } */
export function quietDefer(now, r, q) {
  if (!q || !q.enabled) return null;
  const end = quietEnd(now, q.start, q.end, q.timeZone);
  if (end == null) return null;
  if (q.breakForDeadline && r.deadline && r.deadline >= now - 60000 && r.deadline <= Math.max(end, now + 2 * 3600000)) return null;
  return end;
}
