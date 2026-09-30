import Link from "next/link";
import type { ComponentProps } from "react";

/** A link to the newsletter page. (The sheet it once opened is gone; the name stayed so imports did not move.) */
export function NewsletterLink({ href, children, ...props }: ComponentProps<"a"> & { href: string }) {
  return <Link {...props} href={href}>{children}</Link>;
}
