"use client";

import { ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";

const accepted = ["image/jpeg", "image/png", "image/webp"];
export function FileUpload({ onChange, label = "Kapak görseli seç" }: { onChange: (file: File | null) => void; label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null); const [name, setName] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  const select = (file?: File) => { if (!file) return; if (!accepted.includes(file.type)) { setError("Yalnızca JPG, PNG veya WebP yükleyin."); return; } if (file.size > 5 * 1024 * 1024) { setError("Görsel 5 MB’dan küçük olmalı."); return; } setError(null); setName(file.name); onChange(file); };
  return <div><input ref={inputRef} type="file" accept={accepted.join(",")} className="sr-only" onChange={(event) => select(event.target.files?.[0])} /><button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-28 w-full items-center justify-center gap-3 rounded-2xl border border-dashed border-[#ccc] bg-[#fafafa] px-4 text-sm font-semibold hover:border-black"><ImagePlus size={20} />{name ?? label}</button>{name && <button type="button" className="mt-2 flex items-center gap-1 text-xs text-[#777]" onClick={() => { setName(null); onChange(null); }}><X size={13} /> Seçimi kaldır</button>}{error && <p role="alert" className="mt-2 text-[13px] text-[#b42318]">{error}</p>}</div>;
}
