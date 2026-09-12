"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowDown, ChevronDown } from "lucide-react";
import { PostImageActions } from "@/components/features/visitor/post-image-actions";
import { isOptimizableImage } from "@/lib/images";
import { postPlainText, splitAfterFirstParagraph } from "@/lib/post-content";
import { sourceLabel } from "@/lib/source-label";
import { dateLabel, timeLabel } from "@/lib/visitor-date";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";
import type { Post } from "@/types/database";

/** The opening sentence, the same one the feed card leads with, without its markdown. */
function headline(post: Post) {
  const withoutHeading = post.body.replace(/^#\s+[^\n]+\n+/i, "");
  const plain = withoutHeading
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`~=]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return splitAfterFirstParagraph(plain).first || post.excerpt || post.title;
}

/** Everything after the opening sentence, as paragraphs. Empty when the note is one paragraph. */
function rest(post: Post) {
  const body = postPlainText(post.body.replace(/^#\s+[^\n]+\n+/i, ""));
  const paragraphs = body.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return paragraphs.slice(1);
}

/** How far the finger has to travel before letting go turns the card. */
const threshold = 56;
/** Cards drawn behind the front one. A fourth would be a sliver nobody can see. */
const depth = 2;

/**
 * The newest notes as a deck you swipe, above the feed on a phone.
 *
 * A deck rather than a row: one note at a time has the screen, and the two behind it say there are
 * more without taking any width from the one being read. Dragging moves the front card under the
 * finger and letting go past a threshold turns it; anything short of that springs back.
 *
 * The arrow at the foot of the front card opens the note where it stands, so a reader can finish it
 * without leaving the feed. The pile behind stays exactly where it was — only the front card grows
 * down the page — and an open card can still be flicked on to the next one, which closes it.
 *
 * Only the front card is reachable by keyboard or screen reader — the ones behind are decoration
 * until they come forward. There are no dots under the pile: the peeking edges already say there
 * is more, and a row of markers under a stack is the thing that makes it look like a widget. The
 * arrow keys move through it instead, which costs nothing on screen.
 *
 * From 1024px the feed itself shows this much at a glance and the deck is dropped.
 */
export function FeedHighlights({ posts, language }: { posts: Post[]; language: VisitorLanguage }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [drag, setDrag] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);

  if (posts.length < 2) return null;
  const isEnglish = language === "en";
  /* One slot past the notes: the closing card, which is a place in the deck like any other. */
  const last = posts.length;

  /** Turning the deck closes whatever was open: the card that was expanded is no longer in front. */
  function goTo(next: number) {
    setIndex(next);
    setOpen(false);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    // An open card turns like any other: a reader who has finished the note should be able to flick
    // on without first closing it. Only the axis test below separates that from scrolling the text.
    if (event.pointerType === "mouse" && event.button !== 0) return;
    start.current = { x: event.clientX, y: event.clientY };
    moved.current = false;
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!start.current) return;
    const dx = event.clientX - start.current.x;
    const dy = event.clientY - start.current.y;
    // A mostly-vertical drag belongs to the page, not to the deck.
    if (!moved.current && Math.abs(dy) > Math.abs(dx)) { start.current = null; return; }
    if (Math.abs(dx) > 8) moved.current = true;
    // The deck does not bend past its ends; it only gives a little.
    const atEnd = (dx < 0 && index === last) || (dx > 0 && index === 0);
    setDrag(atEnd ? dx / 4 : dx);
  }

  function onPointerUp() {
    if (!start.current) { setDrag(0); return; }
    start.current = null;
    if (drag <= -threshold && index < last) goTo(index + 1);
    else if (drag >= threshold && index > 0) goTo(index - 1);
    setDrag(0);
  }

  return (
    <section className="visitor-deck" data-open={open || undefined} aria-label={isEnglish ? "Latest notes" : "Son notlar"} aria-roledescription="carousel">
      <div
        className="visitor-deck-stage"
        tabIndex={0}
        role="group"
        aria-label={`${Math.min(index + 1, posts.length)} / ${posts.length}${isEnglish ? " — use the arrow keys" : " — ok tuşlarıyla gezinin"}`}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" && index < last) { event.preventDefault(); goTo(index + 1); }
          if (event.key === "ArrowLeft" && index > 0) { event.preventDefault(); goTo(index - 1); }
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        // A drag that ends on a link must not also count as a tap on it.
        onClickCapture={(event) => { if (moved.current) { event.preventDefault(); event.stopPropagation(); } }}
      >
        {posts.map((post, position) => {
          const offset = position - index;
          if (offset < 0 || offset > depth) return null;
          const front = offset === 0;
          const publishedAt = post.published_at ?? post.created_at;
          const postHref = languageHref(`/haber/${post.id}`, post.language === "tr" ? "tr" : "en");
          const source = sourceLabel(null, post.source_url, isEnglish ? "Source" : "Kaynak");
          return (
            <article
              key={post.id}
              className="visitor-deck-card visitor-card"
              aria-hidden={front ? undefined : true}
              data-front={front ? "" : undefined}
              style={{
                zIndex: posts.length - offset,
                /*
                 * The cards behind are pushed right and squashed vertically, never scaled
                 * horizontally: scaling from the left pulls their right edge back under the front
                 * card, and then the pile has no visible edges at all. They keep these values while
                 * a card is open — the pile stays where it is and only the front card grows, which
                 * is why the front one drops its transform instead of them dropping out.
                 */
                ...(open && front
                  // Open, the front card sits in the flow and takes its height from the text. It
                  // still follows the finger — a transform does not disturb either.
                  ? { transform: drag ? `translate3d(${drag}px, 0, 0)` : undefined, transition: drag ? "none" : undefined }
                  : {
                    transform: `translate3d(calc(${offset * 13}px + ${front ? drag : 0}px), 0, 0) scaleY(${1 - offset * 0.045})`,
                    opacity: front && drag ? Math.max(0.5, 1 - Math.abs(drag) / 320) : 1,
                    transition: drag ? "none" : undefined,
                  }),
              }}
            >
              <div className="visitor-deck-cover">
                {post.cover_path ? (
                  isOptimizableImage(post.cover_path)
                    ? <Image src={post.cover_path} alt="" fill priority={position === 0} sizes="(max-width: 480px) 86vw, 360px" className="object-cover" draggable={false} />
                    // eslint-disable-next-line @next/next/no-img-element -- source images may come from any official publisher host
                    : <img src={post.cover_path} alt="" loading={position === 0 ? "eager" : "lazy"} decoding="async" draggable={false} className="absolute inset-0 size-full object-cover" />
                ) : null}
                {front ? <PostImageActions postId={post.id} href={postHref} title={post.title} language={language} placement="overlay" /> : null}
              </div>

              <div className="visitor-deck-body">
                <p className="visitor-deck-meta visitor-sans">
                  <time dateTime={publishedAt}>{dateLabel(publishedAt, language)}</time>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{timeLabel(publishedAt, language)}</span>
                </p>
                <Link href={postHref} tabIndex={front ? undefined : -1} className="visitor-deck-title visitor-card-link visitor-serif">
                  {headline(post)}
                </Link>
                {open && front ? (
                  <div className="visitor-deck-rest visitor-copy visitor-serif">
                    {rest(post).map((paragraph, line) => <p key={line}>{paragraph}</p>)}
                  </div>
                ) : null}
                <div className="visitor-deck-footer">
                  <p className="visitor-deck-source visitor-sans">{source}</p>
                  {front ? (
                    <button
                      type="button"
                      onClick={() => setOpen(!open)}
                      aria-expanded={open}
                      aria-label={open ? (isEnglish ? "Collapse" : "Kapat") : (isEnglish ? "Read the note here" : "Notu burada oku")}
                      className="visitor-deck-expand"
                    >
                      <ChevronDown size={18} strokeWidth={2} aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}

        {(() => {
          const offset = last - index;
          if (offset < 0 || offset > depth) return null;
          const front = offset === 0;
          return (
            <article
              className="visitor-deck-card visitor-deck-end visitor-card"
              aria-hidden={front ? undefined : true}
              data-front={front ? "" : undefined}
              style={{
                zIndex: 0,
                ...(open && front
                  // Open, the front card sits in the flow and takes its height from the text. It
                  // still follows the finger — a transform does not disturb either.
                  ? { transform: drag ? `translate3d(${drag}px, 0, 0)` : undefined, transition: drag ? "none" : undefined }
                  : {
                    transform: `translate3d(calc(${offset * 13}px + ${front ? drag : 0}px), 0, 0) scaleY(${1 - offset * 0.045})`,
                    opacity: front && drag ? Math.max(0.5, 1 - Math.abs(drag) / 320) : 1,
                    transition: drag ? "none" : undefined,
                  }),
              }}
            >
              <span className="visitor-deck-end-mark" aria-hidden="true"><ArrowDown size={22} strokeWidth={2} /></span>
              <p className="visitor-deck-end-title visitor-sans">{isEnglish ? "That is the latest" : "Son notlar bu kadar"}</p>
              <p className="visitor-deck-end-note visitor-sans">{isEnglish ? "Carry on reading below." : "Okumaya aşağıdan devam edebilirsiniz."}</p>
            </article>
          );
        })()}
      </div>
    </section>
  );
}
