import Link from "next/link";
import { MarkdownPreview } from "@/components/forms/markdown-preview";
import { localizedPage, type CmsPage } from "@/services/pages";

export function VisitorCmsPage({ language, page, pages, siteName }: { language: "tr" | "en"; page: CmsPage; pages: CmsPage[]; siteName: string }) {
  const localized = localizedPage(page, language);
  return <div className="visitor-page flex min-h-screen flex-col items-center bg-[#efefef] px-5 pb-12 pt-5 text-[#0a0a0a]"><nav className="visitor-nav flex w-full max-w-[720px] items-center justify-between gap-4 py-2.5"><Link href={`/?lang=${language}`} className="flex shrink-0 items-center gap-2.5"><span className="flex size-[30px] items-start justify-start rounded-[10px] bg-[#0a0a0a] p-[7px]"><span className="size-[7px] rounded-full bg-white" /></span><strong>{siteName}</strong></Link><div className="flex gap-1 overflow-x-auto">{pages.filter((item) => item.show_in_header).map((item) => <Link key={item.id} href={`/sayfa/${item.slug}?lang=${language}`} className={`flex h-[34px] items-center rounded-full px-3.5 text-sm font-semibold ${item.id === page.id ? "bg-black text-white" : "text-[#4a4a4a]"}`}>{localizedPage(item, language).title}</Link>)}</div></nav><main className="w-full max-w-[720px] pt-10"><article className="visitor-panel rounded-[24px] border border-[#e7e7e7] bg-white p-6 sm:p-9"><h1 className="visitor-heading mb-8 text-[34px] font-semibold tracking-[-.04em]">{localized.title}</h1><div className="visitor-markdown"><MarkdownPreview value={localized.content} /></div></article></main></div>;
}
