"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Copy, Plus, Send, Square, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";
import { LOCAL_CHAT_MODEL, type ChatMessage } from "@/lib/local-chat";

const suggestions = [
  { label: "Metni düzenle", prompt: "Aşağıdaki metni anlamını koruyarak daha akıcı ve anlaşılır hale getir:\n\n" },
  { label: "İngilizceye çevir", prompt: "Aşağıdaki metni doğal bir İngilizceyle çevir:\n\n" },
  { label: "Kısa özet çıkar", prompt: "Aşağıdaki metnin önemli noktalarını kısa bir paragrafta özetle:\n\n" },
];

export function LocalChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState<{ ready: boolean; message: string } | null>(null);
  const [revision, setRevision] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const activeReader = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const scrollArea = useRef<HTMLDivElement>(null);
  const follow = useRef(true);

  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/local-chat", { signal: abort.signal }).then(async response => {
      const data = await response.json();
      if (!abort.signal.aborted) setConnection(response.ok ? data : { ready: false, message: data.error || "Bağlantı kurulamadı." });
    }).catch(() => { if (!abort.signal.aborted) setConnection({ ready: false, message: "Bağlantı kontrol edilemedi. Tekrar deneyin." }); });
    return () => abort.abort();
  }, [revision]);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (follow.current && scrollArea.current) scrollArea.current.scrollTop = scrollArea.current.scrollHeight;
  }, [messages, busy]);

  async function send() {
    const prompt = input.trim();
    if (!prompt || controller.current || !connection?.ready) return;
    const history: ChatMessage[] = [...messages, { role: "user", content: prompt }];
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true); setError(""); setInput(""); follow.current = true;
    setMessages([...history, { role: "assistant", content: "" }]);
    let answer = "";
    let finished = false;
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      const response = await fetch("/api/local-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history }), signal: abort.signal });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Yanıt alınamadı."); }
      if (!response.body) throw new Error("Yanıt akışı açılamadı.");
      reader = response.body.getReader();
      activeReader.current = reader;
      const decoder = new TextDecoder();
      let buffer = "";
      function consume(line: string) {
        if (!line.trim()) return;
        const chunk = JSON.parse(line);
        if (chunk.error) throw new Error("Model yanıtı tamamlayamadı. Tekrar deneyin.");
        if (typeof chunk.message?.content === "string") answer += chunk.message.content;
        if (chunk.done) finished = true;
        if (chunk.done_reason === "length") setError("Yanıt uzunluk sınırına ulaştı. Devam etmesini isteyebilirsiniz.");
      }
      while (true) {
        const { value, done } = await reader.read();
        if (abort.signal.aborted) break;
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
        for (const line of lines) consume(line);
        if (done && buffer.trim()) consume(buffer);
        setMessages([...history, { role: "assistant", content: answer }]);
        if (done) break;
      }
      if (!finished || !answer.trim()) throw new Error("Yanıt tamamlanamadı. Tekrar deneyin.");
    } catch (cause) {
      if (!abort.signal.aborted) setError(cause instanceof Error ? cause.message : "Bağlantı kesildi. Tekrar deneyin.");
      else if (answer.trim()) setError("Yanıt durduruldu.");
    } finally {
      void reader?.cancel().catch(() => {});
      activeReader.current = null;
      if (!answer.trim()) { setMessages(history.slice(0, -1)); setInput(prompt); }
      controller.current = null; setBusy(false); composer.current?.focus();
    }
  }

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); showToast("Yanıt kopyalandı.", "success"); }
    catch { showToast("Kopyalanamadı. Metni seçerek kopyalayabilirsiniz.", "error"); }
  }

  return <section className="flex h-[calc(100dvh-240px)] min-h-[480px] max-h-[900px] w-full flex-col overflow-hidden rounded-2xl border border-line bg-surface" aria-label="Yerel model sohbeti">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-surface-2"><Bot size={21} aria-hidden="true" /></span><div><p className="text-sm font-semibold">{LOCAL_CHAT_MODEL}</p><p className="text-xs text-muted" role="status">{connection?.ready ? "Yerelde çalışıyor" : connection ? "Bağlantı yok" : "Bağlanıyor…"}</p></div></div>
      <Button type="button" variant="ghost" size="sm" disabled={busy || !messages.length} onClick={() => { setMessages([]); setInput(""); setError(""); composer.current?.focus(); }}><Plus size={16} aria-hidden="true" />Yeni sohbet</Button>
    </div>
    {!connection?.ready && connection ? <div role="status" className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2 px-4 py-2 text-sm"><p>{connection.message}</p><Button type="button" variant="ghost" size="sm" onClick={() => { setConnection(null); setRevision(value => value + 1); }}><RefreshCw size={14} aria-hidden="true" />Tekrar bağlan</Button></div> : null}
    <div ref={scrollArea} onScroll={() => { const area = scrollArea.current; if (area) follow.current = area.scrollHeight - area.scrollTop - area.clientHeight < 100; }} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6" aria-label="Sohbet mesajları">
      {!messages.length ? <div className="flex min-h-full flex-col items-center justify-center py-8 text-center"><Bot size={32} strokeWidth={1.5} className="mb-4 text-muted" aria-hidden="true" /><h2 className="text-xl font-semibold">Birlikte ne hazırlayalım?</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted">Bir metin yapıştır veya doğrudan sorunu yaz. Mesajlar bu bilgisayardaki Qwen modeline gönderilir.</p><div className="mt-5 flex flex-wrap justify-center gap-2">{suggestions.map(item => <Button key={item.label} type="button" variant="outline" size="sm" onClick={() => { setInput(item.prompt); composer.current?.focus(); }}>{item.label}</Button>)}</div></div> : <div className="space-y-6">{messages.map((message, index) => <article key={index} className={message.role === "user" ? "ml-auto max-w-[90%] rounded-2xl bg-surface-2 px-4 py-3 sm:max-w-[80%]" : "group/answer max-w-full"}>
      <p className="mb-2 text-xs font-semibold text-muted">{message.role === "user" ? "Sen" : "Qwen"}</p>
      <div className="whitespace-pre-wrap break-words text-[15px] leading-7 [overflow-wrap:anywhere]">{message.content || <span role="status" className="text-muted">Yanıt hazırlanıyor…</span>}</div>
      {message.role === "assistant" && message.content && !(busy && index === messages.length - 1) ? <Button type="button" variant="ghost" size="sm" className="mt-2 w-11 px-0 opacity-0 transition-opacity group-hover/answer:opacity-100 group-focus-within/answer:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100" aria-label="Yanıtı kopyala" title="Yanıtı kopyala" onClick={() => void copy(message.content)}><Copy size={16} aria-hidden="true" /></Button> : null}
    </article>)}</div>}
    </div>
    <form onSubmit={event => { event.preventDefault(); void send(); }} className="border-t border-line bg-surface p-3 sm:p-4">
      {error ? <p role="alert" className="mb-2 text-sm text-danger">{error}</p> : null}
      <div className="rounded-xl border border-line bg-surface-2 p-2 focus-within:border-line-strong">
        <textarea ref={composer} aria-label="Qwen’e mesaj" placeholder="Mesajını yaz…" value={input} maxLength={12000} rows={3} disabled={busy} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }} className="block max-h-52 min-h-20 w-full resize-y border-0 bg-transparent px-2 py-1 text-sm leading-6 outline-none disabled:opacity-60" />
        <div className="flex items-center justify-between gap-2"><span className="px-2 text-[11px] text-muted">{input.length.toLocaleString("tr-TR")} / 12.000</span>{busy ? <Button type="button" size="sm" variant="secondary" onClick={() => { controller.current?.abort(); void activeReader.current?.cancel().catch(() => {}); }}><Square size={14} aria-hidden="true" />Durdur</Button> : <Button type="submit" size="sm" disabled={!input.trim() || !connection?.ready}><Send size={14} aria-hidden="true" />Gönder</Button>}</div>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted">Sohbet bu sayfa açıkken korunur. Enter gönderir, Shift+Enter yeni satır ekler.</p>
    </form>
  </section>;
}
