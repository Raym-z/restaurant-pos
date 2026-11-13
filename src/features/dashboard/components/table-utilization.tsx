"use client";

import { TableProperties } from "lucide-react";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useLocalizedFormat } from "@/i18n/use-localized-format";

import type { DashboardBranchSnapshot } from "../types";

export function TableUtilization({ snapshot }: { snapshot: DashboardBranchSnapshot }) {
  const t = useTranslations("dashboard.tableUtilization");
  const format = useLocalizedFormat();
  const occupancy = format.percent(snapshot.occupancyRate);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">{t("title")}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
        </div>
        <Badge variant="brand">{occupancy}</Badge>
      </div>

      {snapshot.totalTables === 0 ? (
        <EmptyState
          bordered={false}
          compact
          icon={TableProperties}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          className="mt-4"
        />
      ) : (
        <>
          <div className="mt-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-semibold tracking-tight text-ink">{occupancy}</p>
                <p className="mt-1 text-xs text-ink-muted">{t("occupancyDescription")}</p>
              </div>
              <p className="text-sm text-ink-muted">
                {format.number(snapshot.occupiedTables)} / {format.number(snapshot.totalTables)}
              </p>
            </div>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full bg-brand"
                style={{ width: `${Math.round(snapshot.occupancyRate * 100)}%` }}
              />
              <div
                className="h-full bg-surface-subtle"
                style={{
                  width: `${Math.max(0, 100 - Math.round(snapshot.occupancyRate * 100))}%`,
                }}
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-brand" aria-hidden="true" />
                {t("occupiedLegend", { count: snapshot.occupiedTables })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full bg-surface-subtle ring-1 ring-line-strong"
                  aria-hidden="true"
                />
                {t("availableLegend", { count: snapshot.availableTables })}
              </span>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-surface-subtle p-3">
              <dt className="text-xs font-medium text-ink-subtle">{t("activeSessions")}</dt>
              <dd className="mt-1 text-xl font-semibold text-ink">
                {format.number(snapshot.activeSessions)}
              </dd>
            </div>
            <div className="rounded-lg bg-surface-subtle p-3">
              <dt className="text-xs font-medium text-ink-subtle">{t("totalTables")}</dt>
              <dd className="mt-1 text-xl font-semibold text-ink">
                {format.number(snapshot.totalTables)}
              </dd>
            </div>
          </dl>

          {snapshot.occupiedTableLabels.length > 0 ? (
            <div className="mt-5">
              <p className="text-xs font-medium text-ink-subtle">{t("occupiedTables")}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {snapshot.occupiedTableLabels.map((label) => (
                  <Badge key={label} variant="neutral">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </Card>
  );
}
