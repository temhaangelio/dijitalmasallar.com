export type ProfileRole = "admin" | "editor" | "writer";
export type PostStatus = "draft" | "scheduled" | "published" | "archived";
export type NewsletterStatus = "draft" | "scheduled" | "sent" | "cancelled";

export interface Post {
  id: string; author_id: string; title: string; slug: string; excerpt: string; body: string; category: string;
  status: PostStatus; language?: "tr" | "en"; cover_path: string | null; source_name?: string | null; source_url?: string | null; published_at: string | null; scheduled_at: string | null; reads: number;
  show_title?: boolean; show_excerpt?: boolean; created_at: string; updated_at: string;
}
export interface Profile { id: string; full_name: string; avatar_path: string | null; role: ProfileRole; created_at: string; updated_at: string; }
export interface Newsletter {
  id: string; subject: string; preview_text: string; issue_number: number; content: string; status: NewsletterStatus;
  scheduled_at: string | null; sent_at: string | null; recipient_count: number; open_count: number; click_count: number;
  unsubscribe_count: number; created_by: string; created_at: string; updated_at: string;
}
