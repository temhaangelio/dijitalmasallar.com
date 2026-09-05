/** A stable, varied colour per note, shared by the feed and article. */
export function noteInitialTone(id: string) {
  let hash = 2166136261;
  for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0) % 6;
}
