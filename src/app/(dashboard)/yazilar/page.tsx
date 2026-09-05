import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { PostsTable } from "@/components/features/posts/posts-table";
import { getPostsPage, getScheduledPostCount } from "@/services/posts";

export default async function PostsPage({ searchParams }: { searchParams: Promise<{ dil?: string }> }) {
  const params = await searchParams;
  const language = params.dil === "en" ? "en" : "tr";
  const pageSize = 15;
  const [result, scheduledTotal] = await Promise.all([getPostsPage(1, pageSize, language), getScheduledPostCount()]);

  return (
    <AppShell active="/yazilar">
      <PageHeader
        title="Yazılar"
        actions={<Link href="/yazilar/yeni" className={buttonVariants()}>Yeni yazı <ArrowRight className="size-4" aria-hidden="true" /></Link>}
      />
      <PostsTable
        key={`${language}:${result.total}:${JSON.stringify(result.posts.map(post => [post.id, post.title, post.cover_path, post.created_at, post.source_url]))}`}
        initialPosts={result.posts}
        total={result.total}
        language={language}
        scheduledTotal={scheduledTotal}
        pageSize={pageSize}
      />
    </AppShell>
  );
}
