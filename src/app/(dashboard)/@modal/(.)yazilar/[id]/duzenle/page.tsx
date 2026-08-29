import { notFound } from "next/navigation";
import { PostForm } from "@/components/features/posts/post-form";
import { PostFormModal } from "@/components/features/posts/post-form-modal";
import { getPostTranslationsById } from "@/services/posts";

export default async function EditPostModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const posts = await getPostTranslationsById(id);
  if (!posts) notFound();

  return (
    <PostFormModal title="Yazıyı düzenle">
      <PostForm posts={posts} />
    </PostFormModal>
  );
}
