import Link from "next/link";
import type { ComponentProps } from "react";

/** A link to the podcast page. (The listening sheet it once opened is gone; the name stayed so imports did not move.) */
export function ListenLink({ href, children, ...props }: ComponentProps<"a"> & { href: string }) {
  return <Link {...props} href={href}>{children}</Link>;
}
