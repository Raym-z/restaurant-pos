"use client";

import { Clock, Receipt, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLocalizedFormat } from "@/i18n/use-localized-format";

import type { DiningSessionDetail, TableSummary } from "../contracts";
import { TableAvailabilityBadge } from "./pos-status-badges";

export function PosSessionSummary({
  table,
  session,
  timezone,
  actions,
}: {
  table: TableSummary;
  session: DiningSessionDetail;
  timezone: string;
  actions?: React.ReactNode;
}) {
  const t = useTranslations("pos.ordering");
  const format = useLocalizedFormat();

  return (
    <Card>
      <CardContent className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_auto] xl:items-center">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-brand uppercase">
            {t("session.table")}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-xl font-semibold tracking-tight text-ink">{table.label}</p>
            <TableAvailabilityBadge availability={table.availability} />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-subtle">
            <Users className="size-3.5" aria-hidden="true" />
            {t("tableCard.capacity", { count: table.capacity })}
          </p>
        </div>

        <div>
          <p className="text-xs text-ink-muted">{t("session.status")}</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="success">{t("session.active")}</Badge>
            <span className="inline-flex items-center gap-1 text-xs text-ink-subtle">
              <Clock className="size-3.5" aria-hidden="true" />
              {format.dateTime(session.openedAt, timezone)}
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs text-ink-muted">{t("session.orders")}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-ink">
            <Receipt className="size-4 text-ink-subtle" aria-hidden="true" />
            {t("session.orderCounts", {
              total: session.orderCount,
              active: session.activeOrderCount,
            })}
          </p>
          <p className="mt-0.5 text-xs text-ink-subtle">
            {t("session.subtotal")}:{" "}
            {format.currencyAmount(session.subtotalMinor, session.currency)}
          </p>
        </div>

        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </CardContent>
    </Card>
  );
}
