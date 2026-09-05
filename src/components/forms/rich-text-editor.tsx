"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Eraser, Heading1, Heading2, Highlighter, Italic, Link2, Maximize2, Minimize2, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

type RichTextEditorProps = { id: string; name: string; value: string; onChange: (value: string) => void; onBlur: () => void; showToolbar?: boolean; onPasteText?: (value: string) => string | false };
type ToolButtonProps = { label: string; shortcut?: string; onPress: () => void; children: React.ReactNode };

function ToolButton({ label, shortcut, onPress, children }: ToolButtonProps) {
  return <button type="button" aria-label={label} title={shortcut ? `${label} (${shortcut})` : label} onMouseDown={(event) => event.preventDefault()} onClick={onPress} className="grid size-11 shrink-0 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink">{children}</button>;
}

function escapeHtml(value: string) { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

function inlineMarkdownToHtml(value: string) {
  return escapeHtml(value)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer noopener nofollow">$1</a>')
    .replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, "<strong>$1$2</strong>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>")
    .replace(/==([^=]+)==/g, "<mark>$1</mark>")
    .replace(/_([^_\n]+)_|\*([^*\n]+)\*/g, "<em>$1$2</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function markdownToHtml(value: string) {
  return value.split("\n").map((line) => {
    if (!line.trim()) return "<div><br></div>";
    if (line.startsWith("## ")) return `<h2>${inlineMarkdownToHtml(line.slice(3))}</h2>`;
    if (line.startsWith("# ")) return `<h1>${inlineMarkdownToHtml(line.slice(2))}</h1>`;
    if (line.startsWith("> ")) return `<blockquote>${inlineMarkdownToHtml(line.slice(2))}</blockquote>`;
    return `<div>${inlineMarkdownToHtml(line)}</div>`;
  }).join("");
}

function nodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (!(node instanceof HTMLElement)) return "";
  const content = Array.from(node.childNodes).map(nodeToMarkdown).join("");
  if (node.tagName === "SPAN" && node.style.backgroundColor) return `==${content}==`;
  switch (node.tagName) {
    case "STRONG": case "B": return `**${content}**`;
    case "EM": case "I": return `_${content}_`;
    case "DEL": case "S": case "STRIKE": return `~~${content}~~`;
    case "MARK": return `==${content}==`;
    case "CODE": return `\`${content}\``;
    case "A": return `[${content}](${node.getAttribute("href") ?? ""})`;
    case "H1": return `# ${content}\n`;
    case "H2": return `## ${content}\n`;
    case "BLOCKQUOTE": return `> ${content}\n`;
    case "DIV": case "P": return `${content}\n`;
    case "BR": return "\n";
    default: return content;
  }
}

function editorToMarkdown(editor: HTMLElement) { return Array.from(editor.childNodes).map(nodeToMarkdown).join("").replace(/\n{3,}/g, "\n\n").trim(); }

export function RichTextEditor({ id, name, value, onChange, onBlur, showToolbar = true, onPasteText }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && document.activeElement !== editor) editor.innerHTML = markdownToHtml(value);
  }, [value]);

  useEffect(() => {
    if (!fullscreen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setFullscreen(false); };
    const previousOverflow = document.body.style.overflow;
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    editorRef.current?.focus();
    return () => { document.removeEventListener("keydown", close); document.body.style.overflow = previousOverflow; };
  }, [fullscreen]);

  function syncValue() { if (editorRef.current) onChange(editorToMarkdown(editorRef.current)); }
  function command(commandName: string, commandValue?: string) { editorRef.current?.focus(); document.execCommand(commandName, false, commandValue); syncValue(); }
  function addLink() { const url = window.prompt("Bağlantı adresi", "https://"); if (url?.startsWith("http://") || url?.startsWith("https://")) command("createLink", url); }
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!(event.metaKey || event.ctrlKey)) return;
    const key = event.key.toLocaleLowerCase("tr");
    if (key === "b") { event.preventDefault(); command("bold"); }
    if (key === "i") { event.preventDefault(); command("italic"); }
    if (key === "k") { event.preventDefault(); addLink(); }
  }
  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    const replacement = onPasteText?.(text);
    if (replacement !== undefined && replacement !== false) {
      if (editorRef.current) editorRef.current.innerHTML = markdownToHtml(replacement);
      return;
    }
    document.execCommand("insertText", false, text);
    syncValue();
  }

  return (
    <div className={cn("relative overflow-hidden rounded-field border border-transparent bg-surface-2 transition focus-within:border-ink focus-within:bg-white", fullscreen && "fixed inset-0 z-[200] rounded-none border-0 bg-white") }>
      {showToolbar ? <div role="toolbar" aria-label="Metin biçimlendirme" className="absolute right-3 top-3 z-10 flex max-w-[calc(100%_-_24px)] items-center gap-0.5 overflow-x-auto rounded-xl border border-line bg-surface px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ToolButton label="Kalın" shortcut="⌘B" onPress={() => command("bold")}><Bold className="size-[17px]" /></ToolButton>
        <ToolButton label="İtalik" shortcut="⌘I" onPress={() => command("italic")}><Italic className="size-[17px]" /></ToolButton>
        <ToolButton label="Vurgula" onPress={() => command("hiliteColor", "#eaeaea")}><Highlighter className="size-[17px]" /></ToolButton>
        <ToolButton label="Biçimi temizle" onPress={() => command("removeFormat")}><Eraser className="size-[17px]" /></ToolButton>
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-white/20" />
        <ToolButton label="Bağlantı ekle" shortcut="⌘K" onPress={addLink}><Link2 className="size-[17px]" /></ToolButton>
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-white/20" />
        <ToolButton label="Başlık 1" onPress={() => command("formatBlock", "h1")}><Heading1 className="size-[18px]" /></ToolButton>
        <ToolButton label="Başlık 2" onPress={() => command("formatBlock", "h2")}><Heading2 className="size-[18px]" /></ToolButton>
        <ToolButton label="Alıntı" onPress={() => command("formatBlock", "blockquote")}><Quote className="size-[17px]" /></ToolButton>
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-white/20" />
        <ToolButton label={fullscreen ? "Tam ekrandan çık" : "Tam ekran"} shortcut={fullscreen ? "Esc" : undefined} onPress={() => setFullscreen((current) => !current)}>{fullscreen ? <Minimize2 className="size-[17px]" /> : <Maximize2 className="size-[17px]" />}</ToolButton>
      </div> : null}
      <input type="hidden" name={name} value={value} readOnly />
      <div ref={editorRef} id={id} role="textbox" aria-multiline="true" contentEditable suppressContentEditableWarning onInput={syncValue} onBlur={() => { syncValue(); onBlur(); }} onKeyDown={handleKeyDown} onPaste={handlePaste} className={cn("min-h-[360px] px-5 pb-5 font-[family-name:var(--font-source-serif)] text-[19px] leading-7 text-ink outline-none [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-2 [&_blockquote]:border-ink [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:rounded [&_code]:bg-line [&_code]:px-1.5 [&_h1]:mb-3 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-2xl [&_h2]:font-bold [&_mark]:rounded-[3px] [&_mark]:bg-highlight [&_mark]:px-0.5", showToolbar ? "pt-[76px]" : "pt-5", fullscreen && "mx-auto h-screen w-full max-w-5xl overflow-y-auto px-8 pb-20 pt-24 text-[18px] leading-8 sm:px-16")} />
    </div>
  );
}
