"use client";

import { ArrowRight, CircleCheck, Plus, Receipt } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocalizedFormat } from "@/i18n/use-localized-format";

import type { OrderDetail } from "../contracts";
import { OrderStatusBadge } from "./pos-status-badges";

export function PosOrderConfirmation({
  order,
  tableLabel,
  onNewOrder,
}: {
  order: OrderDetail;
  tableLabel: string;
  onNewOrder: () => void;
}) {
  const t = useTranslations("pos.ordering");
  const format = useLocalizedFormat();

  return (
    <Card className="border-success/30 bg-success-soft/25">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
            <CircleCheck className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              {t("confirmation.title")}
            </h2>
            <p className="mt-0.5 text-sm text-ink-muted">
              {t("confirmation.description", {
                reference: order.orderReference,
                table: tableLabel,
              })}
            </p>
          </div>
        </div>

        <dl className="grid gap-3 rounded-lg border border-line bg-surface p-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-ink-muted">{t("confirmation.reference")}</dt>
            <dd className="mt-0.5 font-semibold text-ink">{order.orderReference}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">{t("confirmation.status")}</dt>
            <dd className="mt-0.5">
              <OrderStatusBadge status={order.status} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">{t("confirmation.items")}</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 font-medium text-ink">
              <Receipt className="size-4 text-ink-subtle" aria-hidden="true" />
              {t("orders.itemCount", { count: order.activeItemCount })}
            </dd>
          </div>
          <div className="sm:col-span-3">
            <dt className="text-xs text-ink-muted">{t("confirmation.subtotal")}</dt>
            <dd className="mt-0.5 text-2xl font-semibold tracking-tight text-ink">
              {format.currencyAmount(order.payableSubtotalMinor, order.currency)}
            </dd>
            <p className="mt-1 text-xs text-ink-subtle">{t("confirmation.backendNotice")}</p>
          </div>
        </dl>

        {order.notes ? (
          <p className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-muted">
            {order.notes}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/orders/${order.orderId}`}>
              {t("confirmation.viewOrder")}
              <ArrowRight />
            </Link>
          </Button>
          <Button variant="secondary" onClick={onNewOrder}>
            <Plus />
            {t("confirmation.newOrder")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
