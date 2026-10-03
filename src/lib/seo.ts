import type { Post } from "@/types/database";
import { openingSentence } from "@/lib/post-content";

export function siteUrl(domain = "dijitalmasallar.com") {
  const normalized = domain.trim().replace(/\/$/, "");
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return `https://${normalized || "dijitalmasallar.com"}`;
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

/**
 * The note's headline in full: an authored title, or else the whole opening sentence. The title
 * stored for a note without one is that sentence cut at 110 characters with an ellipsis — fine for
 * a list, wrong for the page's <h1> and its structured data, which get the sentence uncut.
 */
export function postHeadline(post: Pick<Post, "title" | "body">) {
  const title = plainText(post.title);
  if (title && !title.endsWith("…")) return title;
  return openingSentence(post.body) || title;
}

/**
 * The headline shortened for a browser tab or a search result: cut at a word, never mid-word, and
 * marked with an ellipsis only when something was left out.
 */
export function postTitle(post: Pick<Post, "title" | "body">, limit = 70) {
  const headline = postHeadline(post);
  if (headline.length <= limit) return headline;
  const cut = headline.slice(0, limit - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > limit * .6 ? cut.slice(0, space) : cut).replace(/[\s,;:–—-]+$/, "")}…`;
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
