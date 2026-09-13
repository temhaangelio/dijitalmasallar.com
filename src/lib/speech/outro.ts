/** Mix the supplied music quietly underneath the closing; leave all earlier audio intact. */
export function mixClosingMusic(narration: Buffer, music: Buffer, startByte: number): Buffer {
  if (startByte < 0 || startByte >= narration.length || startByte % 2) return narration;
  const result = Buffer.alloc(Math.max(narration.length, startByte + music.length));
  narration.copy(result);
  const count = music.length / 2;
  for (let index = 0; index < count; index++) {
    const fadeIn = Math.min(1, index / (24000 * 0.3));
    const fadeOut = Math.min(1, (count - 1 - index) / (24000 * 0.8));
    const offset = startByte + index * 2;
    const voice = result.readInt16LE(offset);
    const bed = music.readInt16LE(index * 2) * 0.18 * fadeIn * fadeOut;
    result.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(voice + bed))), offset);
  }
  return result;
}
