"use client";

import { BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useStatusLabel } from "@/i18n/use-labels";
import type { OrderStatus } from "@/features/pos/contracts";

import { dashboardOrderStatuses } from "../aggregation";
import type { DashboardBranchSnapshot } from "../types";

type BadgeVariant = "neutral" | "brand" | "accent" | "success" | "warning" | "danger" | "info";

const STATUS_VARIANTS: Record<OrderStatus, BadgeVariant> = {
  pending: "warning",
  accepted: "info",
  preparing: "brand",
  ready: "accent",
  served: "success",
  completed: "neutral",
  cancelled: "danger",
};

const STATUS_BARS: Record<OrderStatus, string> = {
  pending: "bg-warning",
  accepted: "bg-info",
  preparing: "bg-brand",
  ready: "bg-accent",
  served: "bg-success",
  completed: "bg-ink-subtle/40",
  cancelled: "bg-danger",
};

export function OrderActivity({ snapshot }: { snapshot: DashboardBranchSnapshot }) {
  const t = useTranslations("dashboard.orderActivity");
  const statusLabel = useStatusLabel();
  const format = useLocalizedFormat();
  const statuses = dashboardOrderStatuses();
  const maxCount = Math.max(1, ...statuses.map((status) => snapshot.statusCounts[status]));

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">{t("title")}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
        </div>
        <Link href="/orders" className="text-sm font-medium text-brand hover:text-brand-strong">
          {t("viewOrders")}
        </Link>
      </div>

      {snapshot.totalOrders === 0 ? (
        <EmptyState
          bordered={false}
          compact
          icon={BarChart3}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          className="mt-4"
        />
      ) : (
        <ul className="mt-5 space-y-3">
          {statuses.map((status) => {
            const count = snapshot.statusCounts[status];
            const width = count === 0 ? 0 : Math.max(4, Math.round((count / maxCount) * 100));

            return (
              <li key={status}>
                <div className="flex items-center justify-between gap-3">
                  <Badge variant={STATUS_VARIANTS[status]}>{statusLabel(status)}</Badge>
                  <span className="text-sm font-medium text-ink tabular-nums">
                    {format.number(count)}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className={`h-full rounded-full ${STATUS_BARS[status]}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {snapshot.ordersTruncated ? (
        <p className="mt-4 text-xs text-ink-subtle">{t("truncated")}</p>
      ) : null}
    </Card>
  );
}
