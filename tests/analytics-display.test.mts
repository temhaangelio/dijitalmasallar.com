import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyticsChangeLabel, analyticsChartRows } from '../src/lib/analytics-display.ts';
test('percentage changes render one sign and normalize rounded zero', () => {
  assert.equal(analyticsChangeLabel(-12.5), '−%12,5 önceki döneme göre');
  assert.equal(analyticsChangeLabel(12.5), '+%12,5 önceki döneme göre');
  assert.equal(analyticsChangeLabel(-0.01), '%0 önceki döneme göre');
  assert.equal(analyticsChangeLabel(null), 'önceki dönemde veri yok');
});
test('annual chart sums views into separate calendar months', () => {
  assert.deepEqual(analyticsChartRows([
    { date: '2025-12-31', pageviews: 4 },
    { date: '2026-01-01', pageviews: 6 },
    { date: '2026-01-02', pageviews: 3 },
  ], true), [{ date: '2025-12-01', pageviews: 4 }, { date: '2026-01-01', pageviews: 9 }]);
});
