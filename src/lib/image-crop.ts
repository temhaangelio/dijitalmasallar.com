export type CropTransform = { zoom: number; x: number; y: number };
export type CropGeometry = { width: number; height: number; imageWidth: number; imageHeight: number };
export type CropPoint = { x: number; y: number };

export const initialCrop: CropTransform = { zoom: 1, x: 50, y: 50 };
export const maxCropZoom = 3;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** The same cover geometry is used by the preview, gestures and exported canvas. */
export function cropBounds(geometry: CropGeometry, crop: CropTransform) {
  const scale = Math.max(geometry.width / geometry.imageWidth, geometry.height / geometry.imageHeight) * crop.zoom;
  const width = geometry.imageWidth * scale;
  const height = geometry.imageHeight * scale;
  const overflowX = Math.max(0, width - geometry.width);
  const overflowY = Math.max(0, height - geometry.height);
  return { width, height, overflowX, overflowY, left: -overflowX * crop.x / 100, top: -overflowY * crop.y / 100 };
}

export function panCrop(crop: CropTransform, geometry: CropGeometry, dx: number, dy: number): CropTransform {
  const { overflowX, overflowY } = cropBounds(geometry, crop);
  return {
    ...crop,
    x: overflowX > 0.001 ? clamp(crop.x - dx / overflowX * 100, 0, 100) : 50,
    y: overflowY > 0.001 ? clamp(crop.y - dy / overflowY * 100, 0, 100) : 50,
  };
}

/** Keep the image point under the cursor/fingers fixed, except at a crop boundary. */
export function zoomCrop(crop: CropTransform, geometry: CropGeometry, zoom: number, anchor: CropPoint): CropTransform {
  const next = { ...crop, zoom: clamp(zoom, 1, maxCropZoom) };
  const before = cropBounds(geometry, crop);
  const after = cropBounds(geometry, next);
  const ratio = next.zoom / crop.zoom;
  return {
    ...next,
    x: after.overflowX > 0.001 ? clamp(((anchor.x - before.left) * ratio - anchor.x) / after.overflowX * 100, 0, 100) : 50,
    y: after.overflowY > 0.001 ? clamp(((anchor.y - before.top) * ratio - anchor.y) / after.overflowY * 100, 0, 100) : 50,
  };
}
