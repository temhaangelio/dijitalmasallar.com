import { TriangleAlert } from "lucide-react";
import type { VisitorLanguage } from "@/lib/visitor-language";

/** Shared disclosure shown directly on AI-generated editorial images. */
export function AiImageNotice({ language }: { language: VisitorLanguage }) {
  return (
    <span className="absolute bottom-3 left-3 z-20 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1.5 rounded-full border border-line bg-surface/90 px-3 py-1.5 font-mono text-[9px] font-semibold leading-tight text-ink shadow-soft backdrop-blur-md sm:bottom-4 sm:left-4 sm:max-w-[calc(100%-2rem)] sm:text-[10px]">
      <TriangleAlert className="size-3.5 shrink-0 text-accent" aria-hidden="true" />
      {language === "en" ? "AI image" : "Yapay zekâ görseli"}
    </span>
  );
}
