/**
 * Draws the diji.news mark — the `.brand-mark` from `globals.css` — into the PNGs the browser, the
 * manifest and iOS ask for, and writes them straight into the repo.
 *
 * Rather than pulling in an image library, the mark is rendered by hand: it is one rounded square
 * and one circle, and the geometry is worth keeping in the repo so the icons can be regenerated
 * from the same numbers the CSS uses.
 *
 * Run with: node scripts/generate-app-icons.mjs
 */
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

/**
 * `.brand-mark`: a 40px box with a 13px radius, carrying a 9px dot.
 *
 * Keep the dot in the same upper-left resting position as the CSS mark. App icons are static, so
 * this frame preserves the site's recognisable logo instead of inventing a centred variant.
 */
const cornerRadiusRatio = 13 / 40;
const dotDiameterRatio = 9 / 40;
const dotCentreRatio = (9 + 9 / 2) / 40;

const ink = [10, 10, 10];       // --color-ink
const surface = [255, 255, 255]; // --color-surface

/** Coverage of one pixel, sampled on a 4x4 grid, so the curves come out smooth without a canvas. */
const samples = 4;

function roundedSquareCoverage(x, y, size, radius) {
  let hits = 0;
  for (let sy = 0; sy < samples; sy++) {
    for (let sx = 0; sx < samples; sx++) {
      const px = x + (sx + 0.5) / samples;
      const py = y + (sy + 0.5) / samples;
      const dx = Math.max(radius - px, px - (size - radius), 0);
      const dy = Math.max(radius - py, py - (size - radius), 0);
      if (dx * dx + dy * dy <= radius * radius) hits++;
    }
  }
  return hits / (samples * samples);
}

function circleCoverage(x, y, centreX, centreY, radius) {
  let hits = 0;
  for (let sy = 0; sy < samples; sy++) {
    for (let sx = 0; sx < samples; sx++) {
      const dx = x + (sx + 0.5) / samples - centreX;
      const dy = y + (sy + 0.5) / samples - centreY;
      if (dx * dx + dy * dy <= radius * radius) hits++;
    }
  }
  return hits / (samples * samples);
}

function mix(background, foreground, amount) {
  return background + (foreground - background) * amount;
}

/**
 * `maskable` fills the whole square: the launcher crops the icon to its own shape, and only the
 * middle 80% is guaranteed to survive that crop.
 */
function renderIcon(size, { maskable = false, badge = false } = {}) {
  // A notification badge is drawn from its alpha channel alone — Android tints whatever is opaque —
  // so it is the dot by itself, not the mark on its square.
  if (badge) {
    const pixels = Buffer.alloc(size * size * 4);
    const radius = size * 0.4;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const offset = (y * size + x) * 4;
        pixels[offset] = surface[0];
        pixels[offset + 1] = surface[1];
        pixels[offset + 2] = surface[2];
        pixels[offset + 3] = Math.round(circleCoverage(x, y, size / 2, size / 2, radius) * 255);
      }
    }
    return pixels;
  }
  const radius = maskable ? 0 : size * cornerRadiusRatio;
  const dotRadius = (size * dotDiameterRatio) / 2;
  const dotCentre = size * dotCentreRatio;
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const square = radius > 0 ? roundedSquareCoverage(x, y, size, radius) : 1;
      const dot = circleCoverage(x, y, dotCentre, dotCentre, dotRadius);
      const offset = (y * size + x) * 4;
      pixels[offset] = Math.round(mix(ink[0], surface[0], dot));
      pixels[offset + 1] = Math.round(mix(ink[1], surface[1], dot));
      pixels[offset + 2] = Math.round(mix(ink[2], surface[2], dot));
      pixels[offset + 3] = Math.round(square * 255);
    }
  }
  return pixels;
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;  // bit depth
  header[9] = 6;  // colour type: RGBA
  // Every row is prefixed with filter type 0; the rows are small and already compress well.
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const targets = [
  { path: "src/app/icon.png", size: 512 },
  { path: "src/app/apple-icon.png", size: 180, maskable: true },
  { path: "public/icon-192.png", size: 192 },
  { path: "public/icon-512.png", size: 512 },
  { path: "public/icon-maskable-512.png", size: 512, maskable: true },
  { path: "public/badge-96.png", size: 96, badge: true },
];

for (const target of targets) {
  writeFileSync(target.path, encodePng(target.size, renderIcon(target.size, { maskable: target.maskable, badge: target.badge })));
  console.log(`wrote ${target.path} (${target.size}px${target.maskable ? ", maskable" : target.badge ? ", badge" : ""})`);
}
