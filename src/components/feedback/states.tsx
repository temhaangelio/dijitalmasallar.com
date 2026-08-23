import { AlertCircle, Inbox } from "lucide-react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({ title = "Henüz kayıt yok", description = "Yeni bir kayıt eklediğinizde burada görünecek." }: { title?: string; description?: string }) { return <div className="grid min-h-48 place-items-center text-center"><div><Inbox className="mx-auto mb-3 text-muted" /><strong className="block">{title}</strong><p className="mt-1 text-sm text-muted">{description}</p></div></div>; }
export function ErrorState({ message = "Veriler yüklenemedi. Lütfen yeniden deneyin." }: { message?: string }) { return <div role="alert" className="flex items-center gap-3 rounded-field bg-danger-surface p-4 text-sm text-danger"><AlertCircle size={18} />{message}</div>; }
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" {...props} className={cn("animate-pulse rounded-xl bg-line", className ?? "h-6 w-full")} />;
}
