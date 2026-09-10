"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type Dispatch, type KeyboardEvent, type PointerEvent, type SetStateAction } from "react";
import { initialCrop, maxCropZoom, panCrop, zoomCrop, type CropGeometry, type CropPoint, type CropTransform } from "@/lib/image-crop";

type Props = {
  src: string;
  value: CropTransform;
  onChange: Dispatch<SetStateAction<CropTransform>>;
  disabled?: boolean;
};
type SafariGesture = Event & { scale: number; clientX: number; clientY: number };
const distance = (a: CropPoint, b: CropPoint) => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a: CropPoint, b: CropPoint) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

export function ImageCropper({ src, value, onChange, disabled = false }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, CropPoint>());
  const safariZoom = useRef<number | null>(null);
  const [imageSize, setImageSize] = useState<{ imageWidth: number; imageHeight: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const helpId = useId();
  const currentZoom = useRef(value.zoom);
  useLayoutEffect(() => { currentZoom.current = value.zoom; }, [value.zoom]);

  const geometry = useCallback((): CropGeometry | null => {
    const rect = viewportRef.current?.getBoundingClientRect();
    return rect && imageSize && rect.width && rect.height ? { width: rect.width, height: rect.height, ...imageSize } : null;
  }, [imageSize]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onWheel = (event: WheelEvent) => {
      const bounds = geometry();
      if (disabled || !bounds) return;
      event.preventDefault();
      if (safariZoom.current !== null) return;
      const rect = viewportRef.current!.getBoundingClientRect();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? bounds.height : 1);
      const factor = Math.exp(-Math.max(-160, Math.min(160, delta)) * (event.ctrlKey ? 0.01 : 0.003));
      onChange((current) => zoomCrop(current, bounds, current.zoom * factor, { x: event.clientX - rect.left, y: event.clientY - rect.top }));
    };

    // Safari uses GestureEvent for trackpad pinches; touchscreens use the pointer path below.
    const onGesture = (event: Event) => {
      const bounds = geometry();
      if (disabled || !bounds) return;
      event.preventDefault();
      if (event.type === "gestureend") { safariZoom.current = null; return; }
      if (pointers.current.size) return;
      if (event.type === "gesturestart") { safariZoom.current = currentZoom.current; return; }
      const pinch = event as SafariGesture;
      if (safariZoom.current === null || !Number.isFinite(pinch.scale)) return;
      const rect = viewportRef.current!.getBoundingClientRect();
      const anchor = {
        x: Number.isFinite(pinch.clientX) && pinch.clientX >= rect.left && pinch.clientX <= rect.right ? pinch.clientX - rect.left : bounds.width / 2,
        y: Number.isFinite(pinch.clientY) && pinch.clientY >= rect.top && pinch.clientY <= rect.bottom ? pinch.clientY - rect.top : bounds.height / 2,
      };
      const nextZoom = safariZoom.current * pinch.scale;
      onChange((current) => zoomCrop(current, bounds, nextZoom, anchor));
    };
    // Cancellation is scoped to the image; scrolling outside it works normally.
    viewport.addEventListener("wheel", onWheel, { passive: false });
    for (const name of ["gesturestart", "gesturechange", "gestureend"]) viewport.addEventListener(name, onGesture, { passive: false });
    return () => {
      viewport.removeEventListener("wheel", onWheel);
      for (const name of ["gesturestart", "gesturechange", "gestureend"]) viewport.removeEventListener(name, onGesture);
    };
  }, [disabled, geometry, onChange]);

  function startPointer(event: PointerEvent<HTMLDivElement>) {
    if (disabled || !imageSize || event.button !== 0 || pointers.current.size >= 2) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    setDragging(true);
  }

  function movePointer(event: PointerEvent<HTMLDivElement>) {
    const bounds = geometry();
    if (disabled || !bounds || !pointers.current.has(event.pointerId)) return;
    const before = [...pointers.current.values()];
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const after = [...pointers.current.values()];
    if (after.length === 1) {
      onChange((current) => panCrop(current, bounds, after[0].x - before[0].x, after[0].y - before[0].y));
    } else {
      const oldCenter = midpoint(before[0], before[1]);
      const newCenter = midpoint(after[0], after[1]);
      const factor = distance(after[0], after[1]) / Math.max(1, distance(before[0], before[1]));
      const rect = event.currentTarget.getBoundingClientRect();
      onChange((current) => panCrop(
        zoomCrop(current, bounds, current.zoom * factor, { x: oldCenter.x - rect.left, y: oldCenter.y - rect.top }),
        bounds, newCenter.x - oldCenter.x, newCenter.y - oldCenter.y,
      ));
    }
  }

  function endPointer(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!pointers.current.size) setDragging(false);
  }

  function stepZoom(factor: number) {
    const bounds = geometry();
    if (disabled || !bounds) return;
    onChange((current) => zoomCrop(current, bounds, current.zoom * factor, { x: bounds.width / 2, y: bounds.height / 2 }));
  }

  function keyDown(event: KeyboardEvent<HTMLDivElement>) {
    const bounds = geometry();
    if (disabled || !bounds || event.metaKey || event.ctrlKey || event.altKey) return;
    const step = event.shiftKey ? 40 : 10;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (event.key in moves) {
      event.preventDefault();
      const [dx, dy] = moves[event.key];
      onChange((current) => panCrop(current, bounds, dx, dy));
    } else if (["+", "=", "-", "0", "Home"].includes(event.key)) {
      event.preventDefault();
      if (event.key === "0" || event.key === "Home") onChange(initialCrop);
      else stepZoom(event.key === "-" ? 1 / 1.15 : 1.15);
    }
  }

  const controlClass = "grid size-11 shrink-0 place-items-center rounded-xl border border-line-strong bg-surface text-ink transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-35";
  return (
    <div>
      <div
        ref={viewportRef}
        role="group"
        aria-label="Görsel kırpma alanı"
        aria-describedby={helpId}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={startPointer}
        onPointerMove={movePointer}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onLostPointerCapture={endPointer}
        onKeyDown={keyDown}
        className={`relative aspect-video touch-none select-none overflow-hidden rounded-field bg-white outline-offset-4 focus-visible:outline-2 focus-visible:outline-ink ${disabled ? "cursor-wait" : dragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- local object URL in an interactive crop preview */}
        <img src={src} alt="Kırpma önizlemesi" draggable={false} onLoad={(event) => setImageSize({ imageWidth: event.currentTarget.naturalWidth, imageHeight: event.currentTarget.naturalHeight })} className="pointer-events-none absolute inset-0 size-full object-cover" style={{ objectPosition: `${value.x}% ${value.y}%`, transform: `scale(${value.zoom})`, transformOrigin: `${value.x}% ${value.y}%` }} />
        <div className={`pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 border border-white/40 transition-opacity ${dragging ? "opacity-100" : "opacity-40"}`} aria-hidden="true">
          {Array.from({ length: 9 }, (_, index) => <div key={index} className="border border-white/20" />)}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" className={controlClass} aria-label="Uzaklaştır" disabled={disabled || !imageSize || value.zoom <= 1} onClick={() => stepZoom(1 / 1.15)}><Minus size={18} aria-hidden="true" /></button>
          <span className="min-w-12 text-center text-sm tabular-nums text-muted" aria-label={`Yakınlaştırma yüzde ${Math.round(value.zoom * 100)}`}>%{Math.round(value.zoom * 100)}</span>
          <button type="button" className={controlClass} aria-label="Yakınlaştır" disabled={disabled || !imageSize || value.zoom >= maxCropZoom} onClick={() => stepZoom(1.15)}><Plus size={18} aria-hidden="true" /></button>
        </div>
        <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line-strong bg-surface px-3 text-sm font-medium text-ink hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-35" disabled={disabled || !imageSize} onClick={() => onChange(initialCrop)}><RotateCcw size={16} aria-hidden="true" />Sıfırla</button>
      </div>
      <p id={helpId} className="mt-3 text-sm leading-6 text-muted">Görseli sürükle. Yakınlaştırmak için tekerleği veya iki parmağını kullan.<span className="sr-only"> Klavyede ok tuşlarıyla taşı, artı ve eksiyle yakınlaştır, sıfırla başlangıca dön.</span></p>
    </div>
  );
}
