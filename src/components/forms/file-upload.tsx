"use client";

import { ImagePlus, Scissors, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { ImageCropper } from "@/components/forms/image-cropper";
import { cropBounds, initialCrop, type CropTransform } from "@/lib/image-crop";

const accepted = ["image/jpeg", "image/png", "image/webp"];
const maxOriginalBytes = 5 * 1024 * 1024;
const targetBytes = 600 * 1024;
const outputWidth = 1200;
const outputHeight = 675;
const outputQualities = [0.88, 0.84, 0.8, 0.76, 0.72, 0.68];

function canvasBlob(canvas: HTMLCanvasElement, type: "image/webp" | "image/jpeg", quality: number) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Görsel dönüştürülemedi.")), type, quality));
}

async function cropForUpload(file: File, crop: CropTransform) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Görsel işlenemedi.");
  }

  const bounds = cropBounds({ width: outputWidth, height: outputHeight, imageWidth: bitmap.width, imageHeight: bitmap.height }, crop);

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, outputWidth, outputHeight);
  context.drawImage(bitmap, bounds.left, bounds.top, bounds.width, bounds.height);
  bitmap.close();

  let smallest: Blob | null = null;
  for (const quality of outputQualities) {
    const blob = await canvasBlob(canvas, "image/webp", quality);
    // Safari versions without canvas WebP encoding silently return PNG. Sending those bytes with
    // a WebP MIME type makes the server's signature validation reject an otherwise valid image.
    if (blob.type !== "image/webp") {
      smallest = null;
      break;
    }
    if (!smallest || blob.size < smallest.size) smallest = blob;
    if (blob.size <= targetBytes) break;
  }
  if (!smallest) {
    for (const quality of outputQualities) {
      const blob = await canvasBlob(canvas, "image/jpeg", quality);
      if (blob.type !== "image/jpeg") continue;
      if (!smallest || blob.size < smallest.size) smallest = blob;
      if (blob.size <= targetBytes) break;
    }
  }
  if (!smallest || smallest.size > targetBytes) throw new Error("Görsel yeterince küçültülemedi. Daha sade bir görsel deneyin.");

  const baseName = file.name.replace(/\.[^.]+$/, "") || "kapak";
  const extension = smallest.type === "image/webp" ? "webp" : "jpg";
  return new File([smallest], `${baseName}.${extension}`, { type: smallest.type, lastModified: Date.now() });
}

type CropSource = { file: File; url: string };

export function FileUpload({ onChange, label = "Kapak görseli seç", preview }: { onChange: (file: File | null) => void; label?: string; preview?: ReactNode }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [cropSource, setCropSource] = useState<CropSource | null>(null);
  const [crop, setCrop] = useState(initialCrop);
  const [appliedCrop, setAppliedCrop] = useState(initialCrop);

  useEffect(() => {
    const url = cropSource?.url;
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [cropSource?.url]);

  function openCrop(file: File, reset = false) {
    setCrop(reset ? initialCrop : appliedCrop);
    setCropSource({ file, url: URL.createObjectURL(file) });
  }

  function select(file?: File) {
    if (!file) return;
    if (!accepted.includes(file.type)) { setError("Yalnızca JPG, PNG veya WebP yükleyin."); return; }
    if (file.size > maxOriginalBytes) { setError("Görsel 5 MB’dan küçük olmalı."); return; }
    setError(null);
    openCrop(file, true);
  }

  async function applyCrop() {
    if (!cropSource) return;
    setError(null);
    setProcessing(true);
    try {
      const optimized = await cropForUpload(cropSource.file, crop);
      setOriginalFile(cropSource.file);
      setAppliedCrop(crop);
      setPreviewUrl(URL.createObjectURL(optimized));
      setName(`${optimized.name} · ${Math.ceil(optimized.size / 1024)} KB`);
      onChange(optimized);
      setCropSource(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Görsel kırpılamadı.");
    } finally {
      setProcessing(false);
    }
  }

  function closeCrop() {
    if (processing) return;
    setCropSource(null);
    if (!name && inputRef.current) inputRef.current.value = "";
  }

  function clear() {
    setName(null);
    setPreviewUrl(null);
    setError(null);
    setOriginalFile(null);
    setAppliedCrop(initialCrop);
    setCropSource(null);
    if (inputRef.current) inputRef.current.value = "";
    onChange(null);
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept={accepted.join(",")} className="hidden" aria-label={label} onChange={(event) => { select(event.target.files?.[0]); event.target.value = ""; }} />
      {previewUrl || preview ? (
        <button type="button" disabled={processing} onClick={() => inputRef.current?.click()} aria-label="Kapak görselini değiştir" title="Görseli değiştirmek için tıklayın" className="group relative block aspect-video w-full overflow-hidden rounded-field bg-surface-3 disabled:opacity-60">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL for the selected cover
            <img src={previewUrl} alt="Seçilen kapak görseli" className="absolute inset-0 size-full object-cover" />
          ) : preview}
          <span className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-ink/75 text-ink-contrast transition-colors group-hover:bg-ink" aria-hidden="true"><ImagePlus size={18} /></span>
        </button>
      ) : (
        <button type="button" disabled={processing} onClick={() => inputRef.current?.click()} className="flex min-h-28 w-full items-center justify-center gap-3 rounded-field border border-dashed border-line-strong bg-surface-2 px-4 text-sm font-semibold hover:border-ink disabled:opacity-60">
          <ImagePlus size={20} aria-hidden="true" />
          {processing ? "Görsel hazırlanıyor…" : label}
        </button>
      )}
      {name ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          {originalFile ? <button type="button" className="flex min-h-11 items-center gap-1 text-xs font-semibold text-muted hover:text-ink" onClick={() => openCrop(originalFile)}><Scissors size={13} aria-hidden="true" /> Kırpmayı düzenle</button> : null}
          <button type="button" className="flex min-h-11 items-center gap-1 text-xs text-muted hover:text-ink" onClick={clear}><X size={13} aria-hidden="true" /> Seçimi kaldır</button>
        </div>
      ) : null}
      {error && !cropSource && <p role="alert" className="mt-2 text-[13px] text-danger">{error}</p>}

      {cropSource ? (
        <AppDialog title="Kapak görselini kırp" onClose={closeCrop} busy={processing} hideIdentity panelClassName="!max-w-[720px] !bg-canvas !p-4 sm:!p-7">
          <div className="mt-2">
            <h2 className="mb-4 text-xl font-semibold text-ink">Kadrajı ayarla</h2>
            <ImageCropper key={cropSource.url} src={cropSource.url} value={crop} onChange={setCrop} disabled={processing} />
            {error ? <p role="alert" className="mt-3 text-sm text-danger">{error}</p> : null}

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="secondary" disabled={processing} onClick={closeCrop}>Vazgeç</Button>
              <Button type="button" disabled={processing} onClick={() => void applyCrop()}>{processing ? "Hazırlanıyor…" : "Kırpmayı uygula"}</Button>
            </div>
          </div>
        </AppDialog>
      ) : null}
    </div>
  );
}
