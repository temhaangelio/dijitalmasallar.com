/**
 * Deciding whether two addresses are the same story.
 *
 * Deduplication is the whole reason the AI desk does not summarise the same announcement four
 * times: a feed, a sitemap and a listing page routinely give the same article three different URLs,
 * differing only by a tracking parameter, a `www.`, or a trailing slash. Normalising before hashing
 * is what turns `url_hash` into a key the database can enforce.
 *
 * Dependency-free on purpose — this is the piece worth testing on its own.
 */

const trackingParameter = /^(utm_|ref$|ref_|source$|fbclid$|gclid$|mc_|igshid$|_hs)/i;

export function normaliseUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    url.protocol = "https:";
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    for (const key of [...url.searchParams.keys()]) {
      if (trackingParameter.test(key)) url.searchParams.delete(key);
    }
    // Query order is not meaningful to a server but changes the hash, so it is fixed here.
    url.searchParams.sort();
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return value.trim();
  }
}
