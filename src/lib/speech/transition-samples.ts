/** A quiet two-note chime in the same 24 kHz / mono / 16-bit PCM format as Gemini. */
export const TRANSITION_SAMPLE_RATE = 24_000;

export const TRANSITION_SOUNDS = [
  { id: "warm", label: "Sıcak ton", notes: [392, 329.63], spacing: 0.24 },
] as const;
export type TransitionSound = typeof TRANSITION_SOUNDS[number]["id"];
export function isTransitionSound(value: unknown): value is TransitionSound {
  return TRANSITION_SOUNDS.some(sound => sound.id === value);
}

export function newsTransitionSamples(sound: TransitionSound = "warm"): Int16Array {
  const sampleRate = TRANSITION_SAMPLE_RATE;
  const duration = 0.9;
  const pcm = new Int16Array(Math.round(sampleRate * duration));
  const preset = TRANSITION_SOUNDS.find(preset => preset.id === sound) ?? TRANSITION_SOUNDS[0];
  const notes = preset.notes.map((frequency, index) => ({ start: 0.04 + index * preset.spacing, frequency }));
  for (let index = 0; index < pcm.length; index++) {
    const time = index / sampleRate;
    let value = 0;
    for (const note of notes) {
      const age = time - note.start;
      if (age < 0 || age >= 0.60) continue;
      const attack = Math.sin(Math.min(1, age / 0.035) * Math.PI / 2) ** 2;
      const release = Math.sin(Math.min(1, (0.60 - age) / 0.22) * Math.PI / 2) ** 2;
      const envelope = attack * release * Math.exp(-age * 5.5);
      const phase = 2 * Math.PI * note.frequency * age;
      // A soft fundamental with a quiet lower octave adds body without a metallic strike.
      const tone = Math.sin(phase) + 0.22 * Math.sin(phase / 2)
        + 0.055 * Math.exp(-age * 7) * Math.sin(phase * 2);
      value += 0.090 * envelope * tone;
    }
    pcm[index] = Math.round(value * 32767);
  }
  return pcm;
}

