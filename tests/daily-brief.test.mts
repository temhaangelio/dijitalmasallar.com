import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectDailyBrief } from '../src/lib/daily-brief.ts';
const now = new Date('2026-09-06T00:30:00+03:00');
const note = (day: string, body = 'Not') => ({ body, published_at: day, created_at: day });
const today = note('2026-09-05T21:05:00Z');
const yesterday = note('2026-09-05T20:59:00Z');
test('four notes select today across the Istanbul midnight boundary', () => {
  const result = selectDailyBrief([today, today, today, today, yesterday], now);
  assert.equal(result.isYesterday, false);
  assert.equal(result.posts.length, 4);
});
test('fewer than four usable notes select yesterday', () => {
  const result = selectDailyBrief([today, today, today, { ...today, body: ' ' }, yesterday], now);
  assert.equal(result.isYesterday, true);
  assert.deepEqual(result.posts, [yesterday]);
});
test('old notes and future notes never become yesterday’s brief', () => {
  assert.deepEqual(selectDailyBrief([note('2026-09-04T12:00:00Z'), note('2026-09-07T12:00:00Z')], now).posts, []);
});
