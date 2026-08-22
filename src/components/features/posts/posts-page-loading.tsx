import { PageLoading } from "@/components/feedback/page-loading";
import { AdminLoadingShell } from "@/components/layout/admin-loading-shell";
import { PageHeader } from "@/components/layout/page-header";

export function PostsPageLoading() {
  return (
    <AdminLoadingShell active="/yazilar">
      <div className="mx-auto w-full max-w-[1600px]">
      <PageHeader title="Yazılar" note="Yazılar hazırlanıyor" />
      <div className="mb-5 grid grid-cols-2 gap-5 sm:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-[132px] rounded-[28px] bg-white" />)}
      </div>
      <div className="card">
        <PageLoading variant="admin" label="" embedded />
      </div>
      </div>
    </AdminLoadingShell>
  );
}
