/**
 * Shared by the search field, the page that reads `?q=` and the query that runs against Supabase,
 * so all three agree on what a query is. Dependency-free on purpose: the field is a client
 * component and cannot pull in anything from the services layer.
 */

/** A reader can only ever type so much into the field; the rest is dropped before the query runs. */
export const searchQueryLimit = 80;

export function normalizeSearchQuery(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] ?? "" : value ?? "").trim().slice(0, searchQueryLimit);
}
