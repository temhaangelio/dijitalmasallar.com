"use client";

import { useId, useRef, useState, useTransition } from "react";
import { FileSearch, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { addFeedAction, addPageSourceAction } from "@/app/(dashboard)/rss/actions";
import { RssDialog, RssDialogError } from "@/components/features/rss/rss-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast";

/**
 * Adding a feed reaches out to the network and can fail in ways worth reading — a 404, a page that
 * is not a feed, a private address. The dialog keeps that message next to the field that caused it
 * instead of dropping it into a toast that disappears while the URL is still on screen.
 */
function AddFeedDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  // Set when the address had no feed but its page might still be readable as a list of headings.
  const [pageFallbackUrl, setPageFallbackUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    setPageFallbackUrl(null);
    startTransition(async () => {
      const result = await addFeedAction(formData);
      if (!result.success) {
        setError(result.message);
        if (result.canFollowPage) setPageFallbackUrl(String(formData.get("url") ?? "").trim());
        inputRef.current?.focus();
        return;
      }
      showToast(result.message, "success");
      onClose();
      router.refresh();
    });
  }

  /** Second attempt, on the person's say-so: read the page's own links instead of a feed. */
  function followPage() {
    if (!pageFallbackUrl) return;
    setError(null);
    startTransition(async () => {
      const data = new FormData();
      data.set("url", pageFallbackUrl);
      const result = await addPageSourceAction(data);
      if (!result.success) { setError(result.message); setPageFallbackUrl(null); return; }
      showToast(result.message, "success");
      onClose();
      router.refresh();
    });
  }

  return (
    <RssDialog title="Kaynak ekle" onClose={onClose} busy={pending} initialFocusRef={inputRef}>
      <form action={submit} className="mt-6">
        <label htmlFor={inputId} className="mb-2 block text-[13px] font-semibold text-ink-2">RSS adresi</label>
        <Input
          ref={inputRef}
          id={inputId}
          name="url"
          type="url"
          inputMode="url"
          required
          disabled={pending}
          placeholder="https://ornek.com/rss.xml"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        {error && (
          <RssDialogError id={errorId}>
            <p>{error}</p>
            {pageFallbackUrl && (
              <>
                <p className="mt-2 font-normal leading-relaxed text-ink-2">
                  Bu sayfadaki başlıkları doğrudan takip edebilirim. Beslemeye göre daha kırılgan bir yöntem: tarih ve özet gelmez, site tasarımını değiştirirse yeniden bakmak gerekebilir.
                </p>
                <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={followPage} className="mt-3">
                  <FileSearch className="size-4" aria-hidden="true" />Sayfadaki başlıkları takip et
                </Button>
              </>
            )}
          </RssDialogError>
        )}

        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" disabled={pending} onClick={onClose}>Vazgeç</Button>
          <Button type="submit" disabled={pending}>{pending ? "Taranıyor…" : "Kaynağı ekle"}</Button>
        </div>
      </form>
    </RssDialog>
  );
}

export function RssAddFeedButton({ variant = "primary", size = "md" }: { variant?: "primary" | "secondary"; size?: "sm" | "md" }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant={variant} size={size} onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden="true" />Kaynak ekle
      </Button>
      {/* Mounted only while open, so each visit starts with an empty field and no stale error. */}
      {open && <AddFeedDialog onClose={() => setOpen(false)} />}
    </>
  );
}
