/** Rebuild all install icons from the same binary glyphs as BrandMark. */
import sharp from "sharp";
import { readFile } from "node:fs/promises";

const source = await readFile("src/components/ui/brand-mark.tsx", "utf8");
const zero = source.match(/const zero = "([^"]+)"/)[1];
const one = source.match(/const one = "([^"]+)"/)[1];
const targets = [
  { path: "public/logo.png", size: 1024 },
  { path: "src/app/icon.png", size: 512 },
  { path: "src/app/apple-icon.png", size: 180, solid: true },
  { path: "public/icon-192.png", size: 192 },
  { path: "public/icon-512.png", size: 512 },
  { path: "public/icon-maskable-512.png", size: 512, solid: true, safe: true },
];
for (const target of targets) {
  const svg = `<svg viewBox="0 0 100 100" width="1024" height="1024" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="${target.solid ? 0 : 30}" fill="#191919"/><g fill="#fff" fill-rule="evenodd"${target.safe ? ' transform="translate(10 10) scale(.8)"' : ''}><path d="${zero}" transform="translate(28 23)"/><path d="${one}" transform="translate(54 23)"/><path d="${one}" transform="translate(28 54)"/><path d="${zero}" transform="translate(54 54)"/></g></svg>`;
  await sharp(Buffer.from(svg)).resize(target.size).png({ compressionLevel: 9 }).toFile(target.path);
}
