import { AlertCircle, Inbox } from "lucide-react";

export function EmptyState({ title = "Henüz kayıt yok", description = "Yeni bir kayıt eklediğinizde burada görünecek." }: { title?: string; description?: string }) { return <div className="grid min-h-48 place-items-center text-center"><div><Inbox className="mx-auto mb-3 text-[#a1a1a1]" /><strong className="block">{title}</strong><p className="mt-1 text-sm text-[#a1a1a1]">{description}</p></div></div>; }
export function ErrorState({ message = "Veriler yüklenemedi. Lütfen yeniden deneyin." }: { message?: string }) { return <div role="alert" className="flex items-center gap-3 rounded-2xl bg-[#fff1f0] p-4 text-sm text-[#b42318]"><AlertCircle size={18} />{message}</div>; }
export function Spinner() { return <span aria-label="Yükleniyor" className="inline-block size-5 animate-spin rounded-full border-2 border-current border-r-transparent" />; }
export function Skeleton({ className = "h-6 w-full" }: { className?: string }) { return <div aria-hidden className={`animate-pulse rounded-xl bg-[#ececec] ${className}`} />; }
