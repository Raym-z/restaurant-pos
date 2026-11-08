import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OrdersScreen } from "@/features/pos/components/orders-screen";
import { PosLoadError } from "@/features/pos/components/pos-load-error";
import { isOrderStatus, type OrderStatus } from "@/features/pos/contracts";
import {
  ORDERS_PAGE_SIZE,
  ordersPageOffset,
  parseOrdersPage,
} from "@/features/pos/orders-pagination";
import { getPosViewer, loadBranchOrders } from "@/features/pos/services";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("orders") };
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const viewer = await getPosViewer();
  if (!viewer) {
    redirect("/login");
  }

  const params = await searchParams;
  const page = parseOrdersPage(params.page);
  const status: OrderStatus | undefined = isOrderStatus(params.status) ? params.status : undefined;

  const result = await loadBranchOrders(viewer.branchId, {
    status,
    limit: ORDERS_PAGE_SIZE,
    offset: ordersPageOffset(page),
  });

  if (!result.ok) {
    const t = await getTranslations("orders");
    return (
      <PosLoadError error={result.error} backHref="/dashboard" backLabel={t("backToDashboard")} />
    );
  }

  return <OrdersScreen data={result.data} page={page} status={status} />;
}
