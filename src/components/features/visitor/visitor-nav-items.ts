/** The worded navigation, shared by the masthead and the feed's capsule so the two cannot drift.
 *  Favorites is not here: it is a control in the masthead, beside the bell. */
export const visitorNavItems = [
  { href: "/", tr: "Akış", en: "Feed" },
  { href: "/ebulten", tr: "E-bülten", en: "Newsletter" },
  { href: "/about", tr: "Hakkında", en: "About" },
] as const;
