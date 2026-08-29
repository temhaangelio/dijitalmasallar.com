import { PostForm } from "@/components/features/posts/post-form";
import { PostFormModal } from "@/components/features/posts/post-form-modal";

export default function NewPostModal() {
  return (
    <PostFormModal title="Yeni yazı">
      <PostForm combinedEntry />
    </PostFormModal>
  );
}
