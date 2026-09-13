import test from 'node:test';
import assert from 'node:assert/strict';
import { estimatedSpeechSeconds, estimatedSpeechDuration } from '../src/lib/speech/duration.ts';
import { initialSpeechScript } from '../src/lib/speech/script-text.ts';

test('duration handles empty drafts, reading pace and minute boundaries', () => {
  assert.equal(estimatedSpeechDuration('', true), '0 dk 00 sn');
  assert.equal(estimatedSpeechDuration('haber '.repeat(145), false), '1 dk 06 sn');
});

test('only news boundaries contribute transition time in both languages', () => {
  for (const language of ['tr', 'en'] as const) {
    const script = initialSpeechScript('First story.\n\nSecond story.', '2026-09-13', language);
    assert.ok(Math.abs(estimatedSpeechSeconds(script, true) - estimatedSpeechSeconds(script, false) - 0.9) < 0.00001);
  }
});
