"use client";

import { Receipt } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/states/empty-state";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusBadge } from "@/features/pos/components/pos-status-badges";
import type { OrderStatus } from "@/features/pos/contracts";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useStatusLabel } from "@/i18n/use-labels";

import { dashboardOrderStatuses } from "../aggregation";
import type { DashboardOrder } from "../types";

type StatusFilter = OrderStatus | "all";

export function RecentOrdersTable({
  orders,
  timeZone,
  truncated,
}: {
  orders: DashboardOrder[];
  timeZone: string;
  truncated: boolean;
}) {
  const t = useTranslations("dashboard.recentOrders");
  const tCommon = useTranslations("common");
  const statusLabel = useStatusLabel();
  const format = useLocalizedFormat();
  const [status, setStatus] = useState<StatusFilter>("all");
  const statuses = dashboardOrderStatuses();

  const visibleOrders = useMemo(
    () => orders.filter((order) => status === "all" || order.status === status),
    [orders, status],
  );

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-ink">{t("title")}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <span>{t("status")}</span>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
            className="h-9 w-44"
          >
            <option value="all">{t("allStatuses")}</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {statusLabel(value)}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          bordered={false}
          compact
          icon={Receipt}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      ) : visibleOrders.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-ink-muted">{t("noMatch")}</p>
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("order")}</TableHead>
                <TableHead>{t("table")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("placed")}</TableHead>
                <TableHead className="text-right">{t("subtotal")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleOrders.map((order) => (
                <TableRow key={order.orderId}>
                  <TableCell>
                    <Link
                      href={`/orders/${order.orderId}`}
                      className="font-medium text-ink hover:text-brand"
                    >
                      {order.orderReference}
                    </Link>
                  </TableCell>
                  <TableCell>{order.tableLabel ?? tCommon("unknown")}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-ink-muted">
                    {format.dateTime(order.createdAt, timeZone)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {format.currencyAmount(order.payableSubtotalMinor, order.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <div className="border-t border-line px-5 py-3 text-xs text-ink-subtle">
        <p>{t("subtotalNote")}</p>
        {truncated ? <p className="mt-1">{t("truncated")}</p> : null}
      </div>
    </Card>
  );
}
