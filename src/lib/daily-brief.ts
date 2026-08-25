// Relative, extension-carrying imports — like `rss/scrape.ts` — so the Node test runner can load
// this module without the bundler's `@/` alias.
import { summaryLine } from "./post-content.ts";
import { dateKey } from "./visitor-date.ts";
import type { VisitorLanguage } from "@/lib/visitor-language";
import type { Post } from "@/types/database";

/** Three notes is as much as a short paragraph can carry before it stops being a brief. */
export const dailyBriefSize = 3;

/**
 * The notes the brief is written from: the ones published on the newest day that has any. Early in
 * the morning, before the first note of the day is out, that is still yesterday — which is the
 * honest answer, and better than an empty panel under the heading.
 *
 * `posts` arrives newest-first from the feed query, so the first entry names the day.
 */
export function dailyBriefPosts(posts: Post[]) {
  if (!posts.length) return [];
  const day = dateKey(posts[0].published_at ?? posts[0].created_at);
  return posts.filter((post) => dateKey(post.published_at ?? post.created_at) === day).slice(0, dailyBriefSize);
}

/**
 * One note as one sentence of the brief. Nothing is generated here: it is the editor's own excerpt,
 * or the note's opening sentence when it has none. The closing full stop is added only when the
 * sentence lost its own — a truncated line ends in an ellipsis and keeps it — because the sentences
 * are joined into a single paragraph and would otherwise run together.
 */
export function briefSentence(post: Post) {
  const line = summaryLine(post, 200);
  return !line || /[.!?…]$/.test(line) ? line : `${line}.`;
}

/**
 * The brief should read as one telling of the day, not three clippings stacked on top of each other,
 * so the notes after the first are introduced the way a person would introduce them out loud.
 *
 * The sentences themselves are never rewritten — they are what the editor published — and the
 * connectors sit in front of them, where a note that opens on a name ("Apple, …", "MIT ve …", which
 * is how most of them open) still reads correctly.
 */
const connectors: Record<VisitorLanguage, readonly string[]> = {
  tr: ["", "Ayrıca ", "Öte yandan "],
  en: ["", "Meanwhile, ", "Elsewhere, "],
};

export function dailyBriefText(posts: Post[], language: VisitorLanguage = "tr") {
  const sentences = posts.map(briefSentence).filter(Boolean);
  const links = connectors[language] ?? connectors.tr;
  return sentences
    .map((sentence, index) => `${links[index] ?? links[links.length - 1]}${sentence}`)
    .join(" ");
}
