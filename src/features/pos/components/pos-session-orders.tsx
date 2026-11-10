"use client";

import { Receipt } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocalizedFormat } from "@/i18n/use-localized-format";

import type { OrderSummary } from "../contracts";
import { OrderStatusBadge } from "./pos-status-badges";

export function PosSessionOrders({
  orders,
  timezone,
}: {
  orders: readonly OrderSummary[];
  timezone: string;
}) {
  const t = useTranslations("pos.ordering");
  const format = useLocalizedFormat();

  return (
    <Card className="overflow-hidden">
      {orders.length === 0 ? (
        <EmptyState
          bordered={false}
          compact
          icon={Receipt}
          title={t("orders.emptyTitle")}
          description={t("orders.emptyDescription")}
        />
      ) : (
        <ul className="divide-y divide-line">
          {orders.map((order) => (
            <li
              key={order.orderId}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/orders/${order.orderId}`}
                    className="font-medium text-ink hover:text-brand"
                  >
                    {order.orderReference}
                  </Link>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="mt-1 text-xs text-ink-subtle">
                  {format.dateTime(order.createdAt, timezone)} ·{" "}
                  {t("orders.itemCount", { count: order.activeItemCount })}
                </p>
              </div>

              <div className="flex items-center gap-3 sm:text-right">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {format.currencyAmount(order.payableSubtotalMinor, order.currency)}
                  </p>
                  <p className="text-xs text-ink-subtle">{t("orders.payable")}</p>
                  {order.status === "cancelled" ? (
                    <p className="text-xs text-ink-subtle">
                      {t("orders.historical", {
                        amount: format.currencyAmount(order.subtotalMinor, order.currency),
                      })}
                    </p>
                  ) : null}
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/orders/${order.orderId}`}>{t("orders.view")}</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
