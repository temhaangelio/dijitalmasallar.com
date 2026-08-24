"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { renameFeedAction } from "@/app/(dashboard)/rss/actions";
import { RssDialog, RssDialogError } from "@/components/features/rss/rss-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast";
import type { RssFeed } from "@/services/rss";

/**
 * Renaming is local: it changes what the sidebar calls the source, never what the publisher calls
 * it. A name set here is kept through refreshes — the feed's own title stops overwriting it — which
 * is the point, since the reason to rename is usually that the publisher's title is unhelpful.
 */
export function RssRenameFeedDialog({ feed, onClose }: { feed: RssFeed; onClose: () => void }) {
  const router = useRouter();
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    setError(null);
    startTransition(async () => {
      const result = await renameFeedAction(feed.id, title);
      if (!result.success) { setError(result.message); inputRef.current?.focus(); return; }
      showToast(result.message, "success");
      onClose();
      router.refresh();
    });
  }

  return (
    <RssDialog title="Kaynak adını düzenle" onClose={onClose} busy={pending} initialFocusRef={inputRef}>
      <form action={submit} className="mt-6">
        <label htmlFor={inputId} className="mb-2 block text-[13px] font-semibold text-ink-2">Kaynak adı</label>
        <Input
          ref={inputRef}
          id={inputId}
          name="title"
          required
          maxLength={80}
          disabled={pending}
          defaultValue={feed.title}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <p className="mt-2 text-[13px] leading-relaxed text-muted">{feed.url}</p>
        {error && <RssDialogError id={errorId}>{error}</RssDialogError>}

        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" disabled={pending} onClick={onClose}>Vazgeç</Button>
          <Button type="submit" disabled={pending}>{pending ? "Kaydediliyor…" : "Kaydet"}</Button>
        </div>
      </form>
    </RssDialog>
  );
}
