import sharp from "sharp";

const formats: Record<string, { format: string; extension: string }> = {
  "image/jpeg": { format: "jpeg", extension: "jpg" },
  "image/png": { format: "png", extension: "png" },
  "image/webp": { format: "webp", extension: "webp" },
  "image/gif": { format: "gif", extension: "gif" },
};

/** Validate decoded raster metadata instead of trusting a filename or caller-provided MIME type. */
export async function inspectRasterUpload(file: File) {
  if (!(file instanceof File) || !formats[file.type] || file.size === 0 || file.size > 5 * 1024 * 1024) throw new Error("Geçerli ve 5 MB’dan küçük bir görsel seçin.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const expected = formats[file.type];
  try {
    const metadata = await sharp(bytes, { limitInputPixels: 25_000_000 }).metadata();
    if (metadata.format !== expected.format || !metadata.width || !metadata.height || metadata.width * metadata.height > 25_000_000 || (metadata.pages ?? 1) > 120) throw new Error();
  } catch {
    throw new Error("Görselin içeriği veya boyutları geçerli değil. Başka bir görsel seçin.");
  }
  return { bytes, extension: expected.extension, contentType: file.type };
}
