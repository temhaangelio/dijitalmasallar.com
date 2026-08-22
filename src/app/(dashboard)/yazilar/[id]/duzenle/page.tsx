import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { PostForm } from "@/components/features/posts/post-form";
import { getPostTranslationsById } from "@/services/posts";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const posts = await getPostTranslationsById(id);
  if (!posts) notFound();
  return (
    <AppShell active="/yazilar">
      <PageHeader title="Yazıyı düzenle" note="İçeriği ve yayın ayarlarını güncelleyin" />
      <PostForm posts={posts} />
    </AppShell>
  );
}
