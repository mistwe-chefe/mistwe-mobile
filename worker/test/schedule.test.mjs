// Erinnerungsregel – muss identisch zu Schedule.selfTest() in index.html sein.
import assert from 'node:assert/strict';
import { nextInterval, nextAt, quietEnd, quietDefer } from '../src/schedule.js';

const now = Date.UTC(2026, 0, 1, 12, 0, 0);
const M = 60000, H = 60 * M, D = 24 * H;
// Ohne Eskalation: immer das Intervall, alte Abgaben werden ignoriert (identisch zu Schedule.selfTest())
for (const [iv, dl] of [[120, null], [45, null], [1440, now + 3 * M], [1, now + 5 * D]]) {
  assert.equal(nextInterval(iv, dl, 15, now), iv);
  assert.equal(nextAt({ stageMin: iv, deadline: dl, overdueMin: 15 }, now), now + iv * M);
  console.log(`✓ Intervall ${iv} Min`);
}

// Ruhezeiten 22:00–07:00 in Europe/Berlin (Winter: UTC+1)
const tz = 'Europe/Berlin';
const at = (h, m) => Date.UTC(2026, 0, 10, h - 1, m, 0); // lokale Berliner Zeit → UTC
assert.equal(quietEnd(at(12, 0), 1320, 420, tz), null);
assert.equal(quietEnd(at(23, 15), 1320, 420, tz), at(7, 0) + D);
assert.equal(quietEnd(at(3, 0), 1320, 420, tz), at(7, 0));
assert.equal(quietEnd(at(7, 0), 1320, 420, tz), null);
assert.equal(quietEnd(at(13, 0), 720, 840, tz), at(14, 0));
const q = { enabled: true, start: 1320, end: 420, breakForDeadline: true, timeZone: tz };
assert.equal(quietDefer(at(23, 0), { deadline: at(23, 30) }, q), at(7, 0) + D, 'Abgaben durchbrechen nicht mehr');
assert.equal(quietDefer(at(23, 0), { deadline: at(12, 0) + 3 * D }, q), at(7, 0) + D);
assert.equal(quietDefer(at(23, 0), { deadline: null }, { ...q, enabled: false }), null);
console.log('✓ Ruhezeiten');
console.log('Alle Schedule-Tests bestanden.');
