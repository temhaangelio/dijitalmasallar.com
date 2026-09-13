import test from 'node:test';
import assert from 'node:assert/strict';
import { mixClosingMusic } from '../src/lib/speech/outro.ts';

test('outro preserves preceding audio and fades below narration without clipping', () => {
  const voice = Buffer.alloc(96000);
  const music = Buffer.alloc(48000);
  for (let i = 0; i < voice.length; i += 2) voice.writeInt16LE(32000, i);
  for (let i = 0; i < music.length; i += 2) music.writeInt16LE(16000, i);
  const mixed = mixClosingMusic(voice, music, 48000);
  assert.deepEqual(mixed.subarray(0, 48000), voice.subarray(0, 48000));
  assert.equal(mixed.readInt16LE(48000), 32000);
  assert.equal(mixed.readInt16LE(mixed.length - 2), 32000);
  assert.ok(mixed.readInt16LE(70000) > 32000);
  assert.equal(mixClosingMusic(voice, music, -1), voice);
});
