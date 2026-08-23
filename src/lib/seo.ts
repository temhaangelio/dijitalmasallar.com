import type { Post } from "@/types/database";

export function siteUrl(domain = "diji.news") {
  const normalized = domain.trim().replace(/\/$/, "");
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return `https://${normalized || "diji.news"}`;
}

export function absoluteUrl(baseUrl: string, path: string) {
  return new URL(path, `${baseUrl}/`).toString();
}

export function plainText(value: string) {
  return value
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`~=]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function postHeadline(post: Pick<Post, "title" | "body">) {
  const title = plainText(post.title);
  if (title) return title.slice(0, 110);
  const body = plainText(post.body);
  const sentence = body.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || body;
  return sentence.length > 110 ? `${sentence.slice(0, 107).trimEnd()}…` : sentence;
}

export function postDescription(post: Pick<Post, "excerpt" | "body">) {
  const excerpt = plainText(post.excerpt);
  const body = plainText(post.body);
  const description = excerpt || body;
  return description.length > 160 ? `${description.slice(0, 157).trimEnd()}…` : description;
}

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
