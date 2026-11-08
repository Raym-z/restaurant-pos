import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { OrderDetailScreen } from "@/features/pos/components/order-detail-screen";
import { PosLoadError } from "@/features/pos/components/pos-load-error";
import { getPosViewer, loadOrderDetail } from "@/features/pos/services";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("orderDetails") };
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewerResult = await getPosViewer();
  if (viewerResult.status === "unauthenticated") {
    redirect("/login");
  }

  const t = await getTranslations("orders.detail");
  const retryHref = `/orders/${id}`;

  if (viewerResult.status === "unavailable") {
    return (
      <PosLoadError
        error={viewerResult.error}
        backHref="/orders"
        backLabel={t("back")}
        retryHref={retryHref}
      />
    );
  }

  const result = await loadOrderDetail(id, viewerResult.viewer.currency);
  if (!result.ok) {
    if (result.error.code === "ORDER_NOT_FOUND") {
      notFound();
    }

    return (
      <PosLoadError
        error={result.error}
        backHref="/orders"
        backLabel={t("back")}
        retryHref={retryHref}
      />
    );
  }

  return <OrderDetailScreen data={result.data} viewer={viewerResult.viewer} />;
}
