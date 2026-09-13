import test from 'node:test';
import assert from 'node:assert/strict';
import { TRANSITION_SOUNDS, newsTransitionSamples, isTransitionSound } from '../src/lib/speech/transition-samples.ts';
import { newsTransitionPcm } from '../src/lib/speech/transition.ts';

test('the warm preview matches the PCM inserted in recordings', () => {
  const fingerprints = new Set<string>();
  for (const sound of TRANSITION_SOUNDS) {
    const samples = newsTransitionSamples(sound.id);
    const recording = newsTransitionPcm(sound.id);
    assert.equal(samples.length, 21600);
    let peak = 0;
    for (let i = 0; i < samples.length; i++) {
      assert.equal(samples[i], recording.readInt16LE(i * 2));
      peak = Math.max(peak, Math.abs(samples[i]));
    }
    assert.ok(peak > 0 && peak < 8000);
    assert.equal(samples[0], 0);
    assert.equal(samples[samples.length - 1], 0);
    fingerprints.add(recording.toString('base64'));
  }
  assert.equal(fingerprints.size, 1);
  assert.ok(isTransitionSound('warm'));
  assert.equal(isTransitionSound('unknown'), false);
  assert.deepEqual(newsTransitionPcm(), newsTransitionPcm('warm'));
});
