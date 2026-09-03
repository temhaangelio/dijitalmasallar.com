"use client";

import { ImagePlus, Scissors, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { RssDialog } from "@/components/features/rss/rss-dialog";
import { Button } from "@/components/ui/button";

const accepted = ["image/jpeg", "image/png", "image/webp"];
const maxOriginalBytes = 5 * 1024 * 1024;
const targetBytes = 600 * 1024;
const outputWidth = 1200;
const outputHeight = 675;
const outputQualities = [0.88, 0.84, 0.8, 0.76, 0.72, 0.68];

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Görsel dönüştürülemedi.")), "image/webp", quality));
}

async function cropForUpload(file: File, zoom: number, positionX: number, positionY: number) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Görsel işlenemedi.");
  }

  const coverScale = Math.max(outputWidth / bitmap.width, outputHeight / bitmap.height);
  const scale = coverScale * zoom;
  const renderedWidth = bitmap.width * scale;
  const renderedHeight = bitmap.height * scale;
  const offsetX = (renderedWidth - outputWidth) * (positionX / 100);
  const offsetY = (renderedHeight - outputHeight) * (positionY / 100);

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, outputWidth, outputHeight);
  context.drawImage(bitmap, -offsetX, -offsetY, renderedWidth, renderedHeight);
  bitmap.close();

  let smallest: Blob | null = null;
  for (const quality of outputQualities) {
    const blob = await canvasBlob(canvas, quality);
    if (!smallest || blob.size < smallest.size) smallest = blob;
    if (blob.size <= targetBytes) break;
  }
  if (!smallest || smallest.size > targetBytes) throw new Error("Görsel yeterince küçültülemedi. Daha sade bir görsel deneyin.");

  const baseName = file.name.replace(/\.[^.]+$/, "") || "kapak";
  return new File([smallest], `${baseName}.webp`, { type: "image/webp", lastModified: Date.now() });
}

type CropSource = { file: File; url: string };

export function FileUpload({ onChange, label = "Kapak görseli seç" }: { onChange: (file: File | null) => void; label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [cropSource, setCropSource] = useState<CropSource | null>(null);
  const [zoom, setZoom] = useState(1);
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);

  useEffect(() => {
    const url = cropSource?.url;
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [cropSource?.url]);

  function openCrop(file: File, reset = false) {
    if (reset) {
      setZoom(1);
      setPositionX(50);
      setPositionY(50);
    }
    setCropSource({ file, url: URL.createObjectURL(file) });
  }

  function select(file?: File) {
    if (!file) return;
    if (!accepted.includes(file.type)) { setError("Yalnızca JPG, PNG veya WebP yükleyin."); return; }
    if (file.size > maxOriginalBytes) { setError("Görsel 5 MB’dan küçük olmalı."); return; }
    setError(null);
    setOriginalFile(file);
    openCrop(file, true);
  }

  async function applyCrop() {
    if (!cropSource) return;
    setError(null);
    setProcessing(true);
    try {
      const optimized = await cropForUpload(cropSource.file, zoom, positionX, positionY);
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
    setError(null);
    setOriginalFile(null);
    setCropSource(null);
    if (inputRef.current) inputRef.current.value = "";
    onChange(null);
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept={accepted.join(",")} className="sr-only" onChange={(event) => select(event.target.files?.[0])} />
      <button type="button" disabled={processing} onClick={() => inputRef.current?.click()} className="flex min-h-28 w-full items-center justify-center gap-3 rounded-field border border-dashed border-line-strong bg-surface-2 px-4 text-sm font-semibold hover:border-ink disabled:opacity-60">
        {!name ? <ImagePlus size={20} aria-hidden="true" /> : null}
        {processing ? "Görsel hazırlanıyor…" : name ?? label}
      </button>
      {name ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          {originalFile ? <button type="button" className="flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink" onClick={() => openCrop(originalFile)}><Scissors size={13} aria-hidden="true" /> Kırpmayı düzenle</button> : null}
          <button type="button" className="flex items-center gap-1 text-xs text-muted hover:text-ink" onClick={clear}><X size={13} aria-hidden="true" /> Seçimi kaldır</button>
        </div>
      ) : null}
      {error && <p role="alert" className="mt-2 text-[13px] text-danger">{error}</p>}

      {cropSource ? (
        <RssDialog title="Kapak görselini kırp" onClose={closeCrop} busy={processing} hideIdentity panelClassName="!max-w-[720px] !bg-canvas">
          <div className="mt-2">
            <div className="relative aspect-video overflow-hidden rounded-field bg-ink">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL used only inside the crop preview */}
              <img
                src={cropSource.url}
                alt="Kırpma önizlemesi"
                className="absolute inset-0 size-full object-cover"
                style={{ objectPosition: `${positionX}% ${positionY}%`, transform: `scale(${zoom})`, transformOrigin: `${positionX}% ${positionY}%` }}
              />
              <div className="pointer-events-none absolute inset-0 border border-white/30" aria-hidden="true" />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <label className="text-[13px] font-semibold text-ink">
                Yakınlaştır
                <input className="mt-2 block w-full accent-ink" type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
              </label>
              <label className="text-[13px] font-semibold text-ink">
                Yatay konum
                <input className="mt-2 block w-full accent-ink" type="range" min="0" max="100" value={positionX} onChange={(event) => setPositionX(Number(event.target.value))} />
              </label>
              <label className="text-[13px] font-semibold text-ink">
                Dikey konum
                <input className="mt-2 block w-full accent-ink" type="range" min="0" max="100" value={positionY} onChange={(event) => setPositionY(Number(event.target.value))} />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="secondary" disabled={processing} onClick={closeCrop}>Vazgeç</Button>
              <Button type="button" disabled={processing} onClick={() => void applyCrop()}>{processing ? "Hazırlanıyor…" : "Kırpmayı uygula"}</Button>
            </div>
          </div>
        </RssDialog>
      ) : null}
    </div>
  );
}
