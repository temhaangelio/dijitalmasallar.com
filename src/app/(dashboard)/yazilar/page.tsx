import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { PostsTable } from "@/components/features/posts/posts-table";
import { getBilingualPostsPage, getScheduledPostCount } from "@/services/posts";

export default async function PostsPage({ searchParams }: { searchParams: Promise<{ dil?: string }> }) {
  const params = await searchParams;
  const language = params.dil === "en" ? "en" : "tr";
  const [{ tr: turkish, en: english }, scheduledTotal] = await Promise.all([getBilingualPostsPage(1, 20), getScheduledPostCount()]);
  const result = language === "en" ? english : turkish;

  return (
    <AppShell active="/yazilar">
      <div className="mx-auto w-full max-w-[1600px]">
      <PageHeader
        title="Yazılar"
        note={`${result.total.toLocaleString("tr-TR")} yazı`}
        actions={<Link href="/yazilar/yeni" className={buttonVariants()}>Yeni yazı <ArrowRight className="size-4" aria-hidden="true" /></Link>}
      />
      <PostsTable
        key={`${language}:${result.total}:${result.posts[0]?.id ?? "empty"}`}
        initialPosts={result.posts}
        total={result.total}
        language={language}
        scheduledTotal={scheduledTotal}
        initialLanguageData={{ tr: turkish, en: english }}
      />
      </div>
    </AppShell>
  );
}
