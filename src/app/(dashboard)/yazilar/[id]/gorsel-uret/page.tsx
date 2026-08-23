import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { PostImageGenerator } from "@/components/features/posts/post-image-generator";
import { buttonVariants } from "@/components/ui/button";
import { getPostTranslationsById } from "@/services/posts";
import { getSiteSettings } from "@/services/settings";

export default async function GeneratePostImagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [posts, settings] = await Promise.all([getPostTranslationsById(id), getSiteSettings()]);
  if (!posts) notFound();
  const post = posts.tr ?? posts.en;
  if (!post) notFound();

  return (
    <AppShell active="/yazilar">
      <div className="mx-auto w-full max-w-[1180px]">
        <PageHeader
          title="Görsel üret"
          note="Yazıyı Instagram’da paylaşılabilir bir 4:3 karta dönüştürün"
          actions={<Link href="/yazilar" className={buttonVariants({ variant: "outline" })}><ArrowLeft className="mr-2 size-4" />Yazılara dön</Link>}
        />
        <PostImageGenerator title={post.title} body={post.body} sourceName={post.source_name ?? ""} siteName={settings.siteName} imageUrl={post.cover_path} />
      </div>
    </AppShell>
  );
}
