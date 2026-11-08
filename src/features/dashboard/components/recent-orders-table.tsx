"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
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
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useStatusLabel } from "@/i18n/use-labels";
import type { Branch } from "@/features/branches/types";
import type { DashboardOrderStatus, RecentOrder } from "../types";

const STATUS_FILTERS: Array<DashboardOrderStatus | "all"> = [
  "all",
  "new",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

const STATUS_BADGES: Record<
  DashboardOrderStatus,
  "info" | "warning" | "success" | "neutral" | "danger"
> = {
  new: "info",
  preparing: "warning",
  ready: "success",
  completed: "neutral",
  cancelled: "danger",
};

export function RecentOrdersTable({
  orders,
  branches,
  timeZone,
}: {
  orders: RecentOrder[];
  branches: Branch[];
  timeZone: string;
}) {
  const t = useTranslations("dashboard.recentOrders");
  const tCommon = useTranslations("common");
  const statusLabel = useStatusLabel();
  const format = useLocalizedFormat();
  const [status, setStatus] = useState<DashboardOrderStatus | "all">("all");
  const branchById = useMemo(
    () => new Map(branches.map((branch) => [branch.id, branch])),
    [branches],
  );

  const visibleOrders = orders.filter((order) => status === "all" || order.status === status);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-ink">{t("title")}</h2>
          <p className="text-sm text-ink-muted">{t("subtitle")}</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <span>{t("status")}</span>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as DashboardOrderStatus | "all")}
            className="h-9 w-40"
          >
            {STATUS_FILTERS.map((value) => (
              <option key={value} value={value}>
                {value === "all" ? t("allStatuses") : statusLabel(value)}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {visibleOrders.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-ink-muted">{t("noMatch")}</div>
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("order")}</TableHead>
                <TableHead>{t("branch")}</TableHead>
                <TableHead>{t("table")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("placed")}</TableHead>
                <TableHead className="text-right">{t("total")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>
                    {branchById.get(order.branchId)?.name ?? tCommon("unknown")}
                  </TableCell>
                  <TableCell>{order.tableLabel}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGES[order.status]}>{statusLabel(order.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-ink-muted">
                    {format.dateTime(order.placedAt, timeZone)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {format.money(order.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );
}
