import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OrdersScreen } from "@/features/pos/components/orders-screen";
import { PosLoadError } from "@/features/pos/components/pos-load-error";
import { getPosViewer, loadBranchOrders } from "@/features/pos/services";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("orders") };
}

export default async function OrdersPage() {
  const viewer = await getPosViewer();
  if (!viewer) {
    redirect("/login");
  }

  const result = await loadBranchOrders(viewer.branchId);
  if (!result.ok) {
    const t = await getTranslations("orders");
    return (
      <PosLoadError error={result.error} backHref="/dashboard" backLabel={t("backToDashboard")} />
    );
  }

  return <OrdersScreen orders={result.data.orders} />;
}
