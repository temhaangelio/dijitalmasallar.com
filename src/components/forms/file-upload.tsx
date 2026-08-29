"use client";

import { ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";

const accepted = ["image/jpeg", "image/png", "image/webp"];
const maxOriginalBytes = 5 * 1024 * 1024;
const targetBytes = 350 * 1024;
const maxWidth = 800;
const maxHeight = 600;

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Görsel dönüştürülemedi.")), "image/webp", quality));
}

async function optimizeForUpload(file: File) {
  const bitmap = await createImageBitmap(file);
  const baseScale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
  let smallest: Blob | null = null;
  try {
    for (let attempt = 0; attempt < 7; attempt++) {
      const dimensionScale = baseScale * Math.pow(0.82, Math.max(0, attempt - 2));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * dimensionScale));
      canvas.height = Math.max(1, Math.round(bitmap.height * dimensionScale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Görsel işlenemedi.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const quality = Math.max(0.46, 0.8 - attempt * 0.07);
      const blob = await canvasBlob(canvas, quality);
      if (!smallest || blob.size < smallest.size) smallest = blob;
      if (blob.size <= targetBytes) break;
    }
  } finally {
    bitmap.close();
  }
  if (!smallest || smallest.size > targetBytes) throw new Error("Görsel yeterince küçültülemedi. Daha sade bir görsel deneyin.");
  const baseName = file.name.replace(/\.[^.]+$/, "") || "kapak";
  return new File([smallest], `${baseName}.webp`, { type: "image/webp", lastModified: Date.now() });
}

export function FileUpload({ onChange, label = "Kapak görseli seç" }: { onChange: (file: File | null) => void; label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function select(file?: File) {
    if (!file) return;
    if (!accepted.includes(file.type)) { setError("Yalnızca JPG, PNG veya WebP yükleyin."); return; }
    if (file.size > maxOriginalBytes) { setError("Görsel 5 MB’dan küçük olmalı."); return; }
    setError(null);
    setProcessing(true);
    try {
      const optimized = await optimizeForUpload(file);
      setName(`${optimized.name} · ${Math.ceil(optimized.size / 1024)} KB`);
      onChange(optimized);
    } catch (cause) {
      setName(null);
      onChange(null);
      setError(cause instanceof Error ? cause.message : "Görsel küçültülemedi.");
    } finally {
      setProcessing(false);
    }
  }

  function clear() {
    setName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onChange(null);
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept={accepted.join(",")} className="sr-only" onChange={(event) => void select(event.target.files?.[0])} />
      <button type="button" disabled={processing} onClick={() => inputRef.current?.click()} className="flex min-h-28 w-full items-center justify-center gap-3 rounded-field border border-dashed border-line-strong bg-surface-2 px-4 text-sm font-semibold hover:border-ink disabled:opacity-60">
        <ImagePlus size={20} />{processing ? "Görsel küçültülüyor…" : name ?? label}
      </button>
      {name && <button type="button" className="mt-2 flex items-center gap-1 text-xs text-muted" onClick={clear}><X size={13} /> Seçimi kaldır</button>}
      {error && <p role="alert" className="mt-2 text-[13px] text-danger">{error}</p>}
    </div>
  );
}
