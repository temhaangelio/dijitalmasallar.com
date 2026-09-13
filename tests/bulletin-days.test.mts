import test from 'node:test';
import assert from 'node:assert/strict';
import { bulletinDays } from '../src/lib/visitor-date.ts';

test('audio fallback switches at Istanbul midnight and across year boundaries', () => {
  assert.deepEqual(bulletinDays(new Date('2026-09-13T20:59:59Z')), { today: '2026-09-13', yesterday: '2026-09-12' });
  assert.deepEqual(bulletinDays(new Date('2026-09-13T21:00:00Z')), { today: '2026-09-14', yesterday: '2026-09-13' });
  assert.deepEqual(bulletinDays(new Date('2026-12-31T21:00:00Z')), { today: '2027-01-01', yesterday: '2026-12-31' });
});
