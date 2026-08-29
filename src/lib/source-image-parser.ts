const imageProperties = ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"];

function decodeAttribute(value: string) {
  return value.replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'");
}

function metaAttributes(tag: string) {
  const attributes = new Map<string, string>();
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    attributes.set(match[1].toLowerCase(), decodeAttribute(match[2] ?? match[3] ?? ""));
  }
  return attributes;
}

export function extractSourceImage(html: string, pageUrl: string) {
  const candidates = new Map<string, string>();
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attributes = metaAttributes(tag);
    const property = (attributes.get("property") ?? attributes.get("name") ?? "").toLowerCase();
    const content = attributes.get("content");
    if (property && content && !candidates.has(property)) candidates.set(property, content);
  }
  for (const property of imageProperties) {
    const value = candidates.get(property);
    if (!value) continue;
    try {
      const url = new URL(value, pageUrl);
      if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
    } catch { /* Try the next metadata field. */ }
  }
  return null;
}
