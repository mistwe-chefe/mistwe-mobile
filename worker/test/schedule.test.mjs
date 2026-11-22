// Testtabelle aus Architektur 10.2 – muss identisch zu Schedule.selfTest() in index.html sein.
import assert from 'node:assert/strict';
import { nextInterval, nextAt, quietEnd, quietDefer } from '../src/schedule.js';

const now = Date.UTC(2026, 0, 1, 12, 0, 0);
const M = 60000, H = 60 * M, D = 24 * H;
const cases = [
  ['5 Tage', 5 * D, 1440], ['2 Tage', 2 * D, 720], ['1 Tag', D, 360], ['12 Stunden', 12 * H, 180],
  ['6 Stunden', 6 * H, 90], ['2 Stunden', 2 * H, 30], ['1 Stunde', H, 15], ['30 Minuten', 30 * M, 5],
  ['überfällig', -10 * M, 15],
];
for (const [label, rem, exp] of cases) {
  assert.equal(nextInterval(1440, now + rem, 15, now), exp, label);
  console.log(`✓ ${label}: ${exp} Min`);
}
assert.equal(nextInterval(90, null, 15, now), 90); console.log('✓ ohne Abgabe, Stufe 90 Min');
assert.equal(nextInterval(1, null, 15, now), 1); assert.equal(nextInterval(1, now + 5 * D, 15, now), 1); console.log('✓ Teststufe 1 Minute');
assert.equal(nextAt({ stageMin: 1440, deadline: now + 3 * M, overdueMin: 15 }, now), now + 3 * M); console.log('✓ pünktlich zur Abgabe');

// Ruhezeiten 22:00–07:00 in Europe/Berlin (Winter: UTC+1)
const tz = 'Europe/Berlin';
const at = (h, m) => Date.UTC(2026, 0, 10, h - 1, m, 0); // lokale Berliner Zeit → UTC
assert.equal(quietEnd(at(12, 0), 1320, 420, tz), null);
assert.equal(quietEnd(at(23, 15), 1320, 420, tz), at(7, 0) + D);
assert.equal(quietEnd(at(3, 0), 1320, 420, tz), at(7, 0));
assert.equal(quietEnd(at(7, 0), 1320, 420, tz), null);
assert.equal(quietEnd(at(13, 0), 720, 840, tz), at(14, 0));
const q = { enabled: true, start: 1320, end: 420, breakForDeadline: true, timeZone: tz };
assert.equal(quietDefer(at(23, 0), { deadline: at(23, 30) }, q), null, 'Abgabe durchbricht');
assert.equal(quietDefer(at(23, 0), { deadline: at(12, 0) + 3 * D }, q), at(7, 0) + D);
assert.equal(quietDefer(at(23, 0), { deadline: null }, { ...q, enabled: false }), null);
console.log('✓ Ruhezeiten');
console.log('Alle Schedule-Tests bestanden.');
