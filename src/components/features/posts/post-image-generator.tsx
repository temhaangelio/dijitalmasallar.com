"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, ImagePlus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark" | "warm";
type FontId = "modern" | "editorial" | "clean" | "rounded" | "mono";
type CardFormat = { id: string; label: string; width: number; height: number; ratio: string };
const formats: CardFormat[] = [
  { id: "square", label: "Kare gönderi", width: 1080, height: 1080, ratio: "1:1" },
  { id: "portrait", label: "Dikey gönderi", width: 1080, height: 1350, ratio: "4:5" },
  { id: "landscape", label: "Yatay gönderi", width: 1080, height: 566, ratio: "1.91:1" },
  { id: "story", label: "Hikâye", width: 1080, height: 1920, ratio: "9:16" },
  { id: "reels", label: "Reels", width: 1080, height: 1920, ratio: "9:16" },
  { id: "reels-cover", label: "Reels kapak görseli", width: 1080, height: 1920, ratio: "9:16" },
  { id: "profile", label: "Profil fotoğrafı", width: 320, height: 320, ratio: "1:1" },
  { id: "carousel", label: "Karusel gönderisi", width: 1080, height: 1350, ratio: "4:5" },
];
const themes: Record<Theme, { label: string; background: string; foreground: string; muted: string; panel: string }> = {
  light: { label: "Açık", background: "#f2f2f0", foreground: "#101010", muted: "#6f6f6b", panel: "#ffffff" },
  dark: { label: "Koyu", background: "#111111", foreground: "#ffffff", muted: "#a8a8a8", panel: "#1c1c1c" },
  warm: { label: "Sıcak", background: "#e7dfd1", foreground: "#201d18", muted: "#766e62", panel: "#f6f0e7" },
};
const fonts: Record<FontId, { label: string; family: string }> = {
  modern: { label: "Modern", family: "Arial, Helvetica, sans-serif" },
  editorial: { label: "Editoryal", family: "Georgia, 'Times New Roman', serif" },
  clean: { label: "Temiz", family: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  rounded: { label: "Yuvarlak", family: "ui-rounded, 'SF Pro Rounded', Arial, sans-serif" },
  mono: { label: "Mono", family: "'SFMono-Regular', Menlo, Consolas, monospace" },
};

function cleanMarkdown(value: string) {
  return value.replace(/!\[[^\]]*\]\([^)]+\)/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/^#{1,6}\s+/gm, "").replace(/[*_`=>~]/g, "").replace(/\s+/g, " ").trim();
}

function embeddedImage(value: string) {
  return value.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)[^)]*\)/)?.[1] ?? null;
}

function drawWrappedText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth) line = candidate;
    else { if (line) lines.push(line); line = word; }
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.join(" ").length < text.length && lines.length) {
    let last = lines.at(-1) ?? "";
    while (last && context.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    lines[lines.length - 1] = `${last.trimEnd()}…`;
  }
  lines.forEach((item, index) => context.fillText(item, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function loadCanvasImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

export function PostImageGenerator({ title, body, sourceName, siteName, imageUrl: savedImageUrl }: { title: string; body: string; sourceName: string; siteName: string; imageUrl: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const defaultText = useMemo(() => cleanMarkdown(body).slice(0, 520), [body]);
  const defaultImage = useMemo(() => savedImageUrl ?? embeddedImage(body), [body, savedImageUrl]);
  const [text, setText] = useState(defaultText);
  const [source, setSource] = useState(sourceName);
  const [theme, setTheme] = useState<Theme>("light");
  const [fontId, setFontId] = useState<FontId>("modern");
  const [imageUrl, setImageUrl] = useState<string | null>(defaultImage);
  const [formatId, setFormatId] = useState("portrait");
  const format = formats.find((item) => item.id === formatId) ?? formats[1];

  const renderCard = useCallback(async () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const colors = themes[theme];
    const fontFamily = fonts[fontId].family;
    canvas.width = format.width;
    canvas.height = format.height;
    const scale = format.width / 1080;
    const logicalHeight = format.height / scale;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, 1080, logicalHeight);
    context.fillStyle = colors.background;
    context.fillRect(0, 0, 1080, logicalHeight);
    let image: HTMLImageElement | null = null;
    if (imageUrl) {
      try { image = await loadCanvasImage(imageUrl); } catch { /* Remote images without CORS fall back to text. */ }
    }
    const drawImage = (x: number, y: number, width: number, height: number) => {
      if (!image) return;
      const imageScale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
      const drawnWidth = image.naturalWidth * imageScale, drawnHeight = image.naturalHeight * imageScale;
      context.save(); context.beginPath(); context.roundRect(x, y, width, height, 30); context.clip();
      context.drawImage(image, x + (width - drawnWidth) / 2, y + (height - drawnHeight) / 2, drawnWidth, drawnHeight); context.restore();
    };

    if (format.id === "landscape") {
      const panelX = image ? 500 : 40;
      const panelWidth = image ? 540 : 1000;
      if (image) drawImage(40, 40, 430, logicalHeight - 80);
      context.fillStyle = colors.panel; context.beginPath(); context.roundRect(panelX, 40, panelWidth, logicalHeight - 80, 30); context.fill();
      context.fillStyle = colors.foreground; context.font = `700 22px ${fontFamily}`; context.fillText(siteName, panelX + 34, 82);
      context.font = `700 ${image ? 36 : 43}px ${fontFamily}`;
      const titleEnd = drawWrappedText(context, title, panelX + 34, 142, panelWidth - 68, image ? 43 : 50, image ? 3 : 2);
      context.fillStyle = colors.muted; context.font = `400 ${image ? 22 : 25}px ${fontFamily}`;
      drawWrappedText(context, text, panelX + 34, titleEnd + 16, panelWidth - 68, image ? 30 : 34, image ? 5 : 4);
      context.font = `600 17px ${fontFamily}`; context.fillText(source ? `Kaynak · ${source}` : siteName, panelX + 34, logicalHeight - 68);
    } else {
      const padding = 50;
      const imageHeight = image ? Math.min(logicalHeight * 0.4, 650) : 0;
      if (image) drawImage(padding, padding, 980, imageHeight);
      const contentTop = image ? padding + imageHeight + 48 : 60;
      const footerY = logicalHeight - 42;
      context.fillStyle = colors.foreground; context.font = `700 24px ${fontFamily}`; context.fillText(siteName, 68, contentTop);
      const panelTop = contentTop + 34;
      const panelHeight = Math.max(300, footerY - panelTop - 35);
      context.fillStyle = colors.panel; context.beginPath(); context.roundRect(50, panelTop, 980, panelHeight, 32); context.fill();
      const compact = logicalHeight <= 1100;
      context.fillStyle = colors.foreground; context.font = `700 ${compact ? 48 : 56}px ${fontFamily}`;
      const titleEnd = drawWrappedText(context, title, 88, panelTop + 76, 904, compact ? 57 : 66, compact ? 3 : 4);
      context.fillStyle = colors.muted; context.font = `400 ${compact ? 28 : 33}px ${fontFamily}`;
      const available = panelTop + panelHeight - titleEnd - 65;
      const lineHeight = compact ? 39 : 46;
      drawWrappedText(context, text, 88, titleEnd + 22, 904, lineHeight, Math.max(2, Math.floor(available / lineHeight)));
      context.font = `600 20px ${fontFamily}`; context.fillText(source ? `Kaynak · ${source}` : "", 68, footerY);
      context.textAlign = "right"; context.fillText(siteName, 1012, footerY); context.textAlign = "left";
    }
  }, [fontId, format, imageUrl, siteName, source, text, theme, title]);

  useEffect(() => { void renderCard(); }, [renderCard]);

  function selectImage(file?: File) {
    if (!file?.type.startsWith("image/")) return;
    if (imageUrl?.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
  }
  function removeImage() { if (imageUrl?.startsWith("blob:")) URL.revokeObjectURL(imageUrl); setImageUrl(null); }
  function reset() { if (imageUrl?.startsWith("blob:")) URL.revokeObjectURL(imageUrl); setText(defaultText); setSource(sourceName); setTheme("light"); setFontId("modern"); setImageUrl(defaultImage); setFormatId("portrait"); }
  function download() {
    const link = document.createElement("a"); link.href = canvasRef.current?.toDataURL("image/png", 1) ?? "";
    link.download = `${title.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ]+/gi, "-").replace(/^-|-$/g, "").slice(0, 70) || "haber"}-${format.id}.png`; link.click();
  }

  return <div className="grid gap-5 lg:grid-cols-[minmax(300px,.72fr)_minmax(0,1.28fr)]">
    <section className="card h-fit">
      <h2 className="text-xl font-bold tracking-[-.035em]">Kart ayarları</h2><p className="mt-2 text-sm leading-6 text-[#777]">Metin yazıdan otomatik alındı. Kartta görünecek kısmı düzenleyebilirsiniz.</p>
      <label htmlFor="card-text" className="mt-6 block text-sm font-semibold">Kart metni</label><textarea id="card-text" value={text} onChange={(event) => setText(event.target.value)} maxLength={520} rows={8} className="mt-2 w-full resize-y rounded-[20px] border border-[#dedede] bg-white p-4 text-[15px] leading-6 outline-none transition focus:border-black" /><div className="mt-2 text-right text-xs text-[#999]">{text.length}/520</div>
      <label htmlFor="card-source" className="mt-5 block text-sm font-semibold">Kaynak</label><input id="card-source" value={source} onChange={(event) => setSource(event.target.value)} maxLength={80} className="mt-2 h-12 w-full rounded-full border border-[#dedede] bg-white px-4 text-[15px] outline-none transition focus:border-black" />
      <label htmlFor="card-format" className="mt-5 block text-sm font-semibold">Boyut</label><select id="card-format" value={formatId} onChange={(event) => setFormatId(event.target.value)} className="mt-2 h-12 w-full rounded-full border border-[#dedede] bg-white px-4 text-[15px] font-semibold outline-none focus:border-black">{formats.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.width} × {item.height} · {item.ratio}</option>)}</select>
      <label htmlFor="card-font" className="mt-5 block text-sm font-semibold">Yazı tipi</label><select id="card-font" value={fontId} onChange={(event) => setFontId(event.target.value as FontId)} className="mt-2 h-12 w-full rounded-full border border-[#dedede] bg-white px-4 text-[15px] font-semibold outline-none focus:border-black">{(Object.keys(fonts) as FontId[]).map((value) => <option key={value} value={value} style={{ fontFamily: fonts[value].family }}>{fonts[value].label}</option>)}</select>
      <span className="mt-5 block text-sm font-semibold">Tema</span><div className="mt-2 grid grid-cols-3 gap-2">{(Object.keys(themes) as Theme[]).map((value) => <button key={value} type="button" onClick={() => setTheme(value)} className={`h-11 rounded-full text-sm font-semibold transition ${theme === value ? "bg-black text-white" : "bg-[#f1f1f1] text-black hover:bg-[#e7e7e7]"}`}>{themes[value].label}</button>)}</div>
      <span className="mt-5 block text-sm font-semibold">Görsel</span><div className="mt-2 flex gap-2"><label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-[#f1f1f1] px-5 text-sm font-semibold hover:bg-[#e7e7e7]"><ImagePlus className="mr-2 size-4" />{imageUrl ? "Görseli değiştir" : "Görsel ekle"}<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => selectImage(event.target.files?.[0])} /></label>{imageUrl ? <Button type="button" variant="ghost" onClick={removeImage}><X className="mr-2 size-4" />Kaldır</Button> : null}</div>
      <Button type="button" variant="ghost" onClick={reset} className="mt-6 w-full"><RotateCcw className="mr-2 size-4" />Başlangıca dön</Button>
    </section>
    <section className="card"><div className="mb-5 flex items-center justify-between gap-4"><div><h2 className="text-xl font-bold tracking-[-.035em]">Önizleme</h2><p className="mt-1 text-sm text-[#999]">{format.width} × {format.height} px · {format.ratio} · {format.label}</p></div><Button type="button" variant="outline" onClick={download}><Download className="mr-2 size-4" />PNG indir</Button></div><div className="mx-auto max-h-[75vh] max-w-full overflow-hidden rounded-[24px] bg-[#e8e8e8]" style={{ aspectRatio: `${format.width} / ${format.height}` }}><canvas ref={canvasRef} width={format.width} height={format.height} aria-label={`${format.label} önizlemesi`} className="block size-full" /></div></section>
  </div>;
}
