import { test } from "node:test";
import assert from "node:assert/strict";
import { cropBounds, initialCrop, panCrop, zoomCrop, type CropGeometry } from "../src/lib/image-crop.ts";

const square: CropGeometry = { width: 800, height: 450, imageWidth: 1000, imageHeight: 1000 };
const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 0.00001, `${actual} ≠ ${expected}`);

test("a square cover starts centered with exactly the expected visible image region", () => {
  const bounds = cropBounds(square, initialCrop);
  assert.equal(bounds.width, 800);
  assert.equal(bounds.height, 800);
  near(bounds.left, 0);
  assert.equal(bounds.top, -175);
});

test("drag follows the hand and stops at image edges without exposing empty canvas", () => {
  const moved = panCrop(initialCrop, square, 100, 100);
  near(cropBounds(square, moved).top, -75);
  near(cropBounds(square, moved).left, 0);
  assert.equal(panCrop(moved, square, 10000, 10000).y, 0);
  assert.equal(panCrop(moved, square, -10000, -10000).y, 100);
});

test("wheel and pinch zoom preserve the source pixel under an off-center cursor", () => {
  const anchor = { x: 200, y: 100 };
  const before = cropBounds(square, initialCrop);
  const zoomed = zoomCrop(initialCrop, square, 2, anchor);
  const after = cropBounds(square, zoomed);
  near((anchor.x - before.left) / before.width, (anchor.x - after.left) / after.width);
  near((anchor.y - before.top) / before.height, (anchor.y - after.top) / after.height);
  near(zoomed.x, 25);
});

test("zoom limits and extreme drags keep landscape and portrait images covering the frame", () => {
  for (const [imageWidth, imageHeight] of [[4000, 500], [500, 4000], [1920, 1080], [500, 500]]) {
    const geometry = { ...square, imageWidth, imageHeight };
    for (const zoom of [0.01, 1, 1.2, 2, 3, 99]) {
      for (const direction of [-1, 1]) {
        const crop = panCrop(zoomCrop(initialCrop, geometry, zoom, { x: 0, y: 450 }), geometry, direction * 10000, direction * 10000);
        const bounds = cropBounds(geometry, crop);
        assert.ok(crop.zoom >= 1 && crop.zoom <= 3);
        assert.ok(bounds.left <= 0.00001 && bounds.top <= 0.00001);
        assert.ok(bounds.left + bounds.width >= geometry.width - 0.00001);
        assert.ok(bounds.top + bounds.height >= geometry.height - 0.00001);
      }
    }
  }
});

test("mobile preview and 1200×675 export select the same source region after pan and zoom", () => {
  const mobile = { ...square, width: 320, height: 180 };
  const crop = panCrop(zoomCrop(initialCrop, mobile, 2.2, { x: 110, y: 70 }), mobile, 27, -18);
  const preview = cropBounds(mobile, crop);
  const exported = cropBounds({ ...mobile, width: 1200, height: 675 }, crop);
  near(preview.left / preview.width, exported.left / exported.width);
  near(preview.top / preview.height, exported.top / exported.height);
  near(mobile.width / preview.width, 1200 / exported.width);
  near(mobile.height / preview.height, 675 / exported.height);
});

test("zooming out restores the full-cover framing and cannot create NaN on a fitted axis", () => {
  const zoomed = zoomCrop(initialCrop, square, 2, { x: 400, y: 225 });
  const reset = zoomCrop(zoomed, square, 1, { x: 400, y: 225 });
  near(reset.x, 50);
  near(reset.y, 50);
  near(reset.zoom, 1);
});
