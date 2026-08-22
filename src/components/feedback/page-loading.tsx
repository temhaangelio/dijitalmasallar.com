type PageLoadingProps = {
  variant?: "visitor" | "admin";
  label?: string;
  embedded?: boolean;
};

export function PageLoading({ variant = "visitor", label = "Yükleniyor", embedded = false }: PageLoadingProps) {
  return (
    <div className={`page-loading page-loading-${variant} grid place-items-center ${embedded ? "page-loading-embedded min-h-[420px]" : "min-h-screen px-5"}`} role="status" aria-live="polite">
      <div className="flex min-w-[190px] flex-col items-center gap-4 px-8 py-9">
        <span className="relative block size-12 rounded-[16px] bg-black shadow-[0_10px_30px_rgba(0,0,0,.08)]" aria-hidden="true">
          <span className="diji-loading-dot absolute left-2.5 top-2.5 size-2 rounded-full bg-white" />
        </span>
        {label ? <span className="text-sm font-semibold tracking-[-.02em] text-[#8a8a8a]">{label}</span> : <span className="sr-only">Yükleniyor</span>}
      </div>
    </div>
  );
}
