"use client";

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
import { formatDateTime, formatMoney } from "@/features/shared/format";
import type { Branch } from "@/features/branches/types";
import type { DashboardOrderStatus, RecentOrder } from "../types";
import { DASHBOARD_ORDER_STATUS_LABELS } from "../types";

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
          <h2 className="text-base font-semibold text-ink">Recent orders</h2>
          <p className="text-sm text-ink-muted">Live service activity from the last hour</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <span>Status</span>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as DashboardOrderStatus | "all")}
            className="h-9 w-40"
          >
            {STATUS_FILTERS.map((value) => (
              <option key={value} value={value}>
                {value === "all" ? "All statuses" : DASHBOARD_ORDER_STATUS_LABELS[value]}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {visibleOrders.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-ink-muted">
          No orders match this status filter.
        </div>
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Placed</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{branchById.get(order.branchId)?.name ?? "—"}</TableCell>
                  <TableCell>{order.tableLabel}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGES[order.status]}>
                      {DASHBOARD_ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-ink-muted">
                    {formatDateTime(order.placedAt, timeZone)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(order.total)}
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
