"use client";

import { usePathname } from "next/navigation";
import { PageLoading } from "@/components/feedback/page-loading";
import { PostsPageLoading } from "@/components/features/posts/posts-page-loading";

export default function Loading() {
  const pathname = usePathname();
  if (pathname.startsWith("/yazilar")) return <PostsPageLoading />;
  return <PageLoading variant="admin" label="Panel hazırlanıyor" />;
}
