import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { PostForm } from "@/components/features/posts/post-form";
export default function NewPostPage() { return <AppShell active="/yazilar"><PageHeader title="Yeni yazı" /><PostForm combinedEntry /></AppShell>; }
