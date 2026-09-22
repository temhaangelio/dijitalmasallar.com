/**
 * The site's mark, as a data URI, for the share cards.
 *
 * The cards are drawn by satori, which lays out HTML but cannot reach into the app's components or
 * load a file from `public` — so the mark travels as an inline SVG. The four glyph paths are the
 * ones in `public/dijital-masallar-icon.svg` and `BrandMark`: 0 1 over 1 0, the binary the name is
 * built on. Colours are passed in because the mark inverts with the ground it sits on, exactly as it
 * does on the site.
 */
const zero = "M9 0C3.2 0 0 4.5 0 12s3.2 12 9 12 9-4.5 9-12S14.8 0 9 0ZM9 4.5c3.1 0 4.5 2.5 4.5 7.5s-1.4 7.5-4.5 7.5S4.5 17 4.5 12 5.9 4.5 9 4.5Z";
const one = "M3 5.5 9.5 0H14V24H9.5V5.8L5.4 9Z";

const cells = [
  { x: 28, y: 23, path: zero },
  { x: 54, y: 23, path: one },
  { x: 28, y: 54, path: one },
  { x: 54, y: 54, path: zero },
];

export function brandMarkDataUri({ square, digits }: { square: string; digits: string }) {
  const glyphs = cells.map((cell) => `<path transform="translate(${cell.x} ${cell.y})" d="${cell.path}"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" rx="32.5" fill="${square}"/><g fill="${digits}" fill-rule="evenodd">${glyphs}</g></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
