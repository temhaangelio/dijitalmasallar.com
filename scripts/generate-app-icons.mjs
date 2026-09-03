/**
 * Generates browser and installable-app icons from the canonical square logo.
 * Run with: node scripts/generate-app-icons.mjs
 */
import sharp from "sharp";

const targets = [
  { path: "public/logo.png", size: 1024 },
  { path: "src/app/icon.png", size: 512 },
  { path: "src/app/apple-icon.png", size: 180 },
  { path: "public/icon-192.png", size: 192 },
  { path: "public/icon-512.png", size: 512 },
  { path: "public/icon-maskable-512.png", size: 512 },
];

for (const target of targets) {
  const logo = Buffer.from(`<svg width="512" height="512" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><style>text{font-family:Montserrat,sans-serif;font-size:28px;font-weight:800}</style><rect width="100" height="100" rx="30" fill="#050505"/><g fill="#fff" text-anchor="middle"><text x="37" y="45">0</text><text x="63" y="45">1</text><text x="37" y="72">1</text><text x="63" y="72">0</text></g></svg>`);
  await sharp(logo)
    .resize(target.size, target.size)
    .png({ compressionLevel: 9, palette: true })
    .toFile(target.path);
  console.log(`wrote ${target.path} (${target.size}px)`);
}
