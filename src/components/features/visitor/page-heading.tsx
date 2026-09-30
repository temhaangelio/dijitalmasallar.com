import type { ReactNode } from "react";

/**
 * The heading every section page opens with, drawn like the feed's day heading: the name in ink
 * over a rule, with an optional line of explanation and an optional control on the right.
 */
export function VisitorPageHeading({ title, lede, aside }: { title: string; lede?: string; aside?: ReactNode }) {
  return (
    <header className="feed-page-heading visitor-sans">
      <div className="feed-page-heading-row">
        <h1 className="feed-page-title">{title}</h1>
        {aside ? <div className="feed-page-aside">{aside}</div> : null}
      </div>
      {lede ? <p className="feed-page-lede">{lede}</p> : null}
    </header>
  );
}
