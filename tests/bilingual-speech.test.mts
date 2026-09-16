import test from 'node:test';
import assert from 'node:assert/strict';
import { languagesNeedingRecording, runBilingualTasks, speechLanguages } from '../src/lib/speech/bilingual.ts';

test('shared action runs languages sequentially and preserves success after a failure', async () => {
  const events: string[] = [];
  const results = await runBilingualTasks(speechLanguages, async language => {
    events.push(`start:${language}`);
    await Promise.resolve();
    events.push(`end:${language}`);
    if (language === 'en') throw new Error('provider unavailable');
    return { success: true, message: 'saved locally' };
  });
  assert.deepEqual(events, ['start:tr', 'end:tr', 'start:en', 'end:en']);
  assert.equal(results.tr?.success, true);
  assert.equal(results.en?.success, false);
});

test('failure in Turkish does not prevent the English request', async () => {
  const results = await runBilingualTasks(speechLanguages, async language => ({ success: language === 'en', message: '' }));
  assert.equal(results.tr?.success, false);
  assert.equal(results.en?.success, true);
});

test('existing local recordings are skipped, including after reopening and text edits', () => {
  assert.deepEqual(languagesNeedingRecording({ tr: [], en: [] }), ['tr', 'en']);
  assert.deepEqual(languagesNeedingRecording({ tr: [{ script: 'Turkish script' }], en: [] }), ['en']);
  assert.deepEqual(languagesNeedingRecording({ tr: [], en: [{ script: 'English script' }] }), ['tr']);
  assert.deepEqual(languagesNeedingRecording({ tr: [{ script: 'Turkish script' }], en: [{ script: 'English script' }] }), []);
});


test('only edited scripts need regeneration and saved scripts are not generated again', () => {
  const recordings = { tr: [{ script: 'Turkish script' }], en: [{ script: 'English script' }] };
  assert.deepEqual(languagesNeedingRecording(recordings, { tr: 'Shorter Turkish', en: null }), ['tr']);
  assert.deepEqual(languagesNeedingRecording(recordings, { tr: 'Turkish script', en: 'Shorter English' }), ['en']);
  assert.deepEqual(languagesNeedingRecording(recordings, { tr: 'Turkish script', en: 'English script' }), []);
});
