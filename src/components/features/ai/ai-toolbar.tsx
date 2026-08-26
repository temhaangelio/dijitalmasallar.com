"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";
import { collectNowAction, summarizeNowAction } from "@/app/(dashboard)/yapay-zeka/actions";

/**
 * The manual equivalents of the two cron jobs. They exist for the first run and for the moment
 * something looks stuck — waiting fifteen minutes to find out whether a newly added source works
 * is not a debugging loop anyone should be asked to use.
 */
export function AiToolbar({ pendingCount }: { pendingCount: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ success: boolean; message: string }>) {
    startTransition(async () => {
      const result = await action();
      showToast(result.message, result.success ? "success" : "error");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => run(collectNowAction)}>
        <RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} aria-hidden="true" /> Kaynakları tara
      </Button>
      <Button type="button" size="sm" disabled={pending || !pendingCount} onClick={() => run(summarizeNowAction)}>
        <Sparkles className="size-4" aria-hidden="true" />
        {pendingCount ? `${pendingCount} içeriği özetle` : "Özetlenecek içerik yok"}
      </Button>
    </div>
  );
}
