export type PostStatus = "draft" | "scheduled" | "published" | "archived";

export interface Post {
  id: string; author_id: string; title: string; slug: string; excerpt: string; body: string;
  status: PostStatus; language?: "tr" | "en"; cover_path: string | null; source_url?: string | null; featured: boolean; published_at: string | null; scheduled_at: string | null; reads: number;
  created_at: string; updated_at: string;
}
