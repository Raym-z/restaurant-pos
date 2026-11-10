"use client";

import { DoorOpen, TableProperties, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocalizedFormat } from "@/i18n/use-localized-format";

import type { TableSummary } from "../contracts";
import { tableSelectionMode } from "../table-selection";
import { TableAvailabilityBadge } from "./pos-status-badges";

export function PosTableSelection({
  tables,
  branchName,
  timezone,
  selectedTableId,
  onSelect,
}: {
  tables: readonly TableSummary[];
  branchName: string;
  timezone: string;
  selectedTableId?: string;
  onSelect: (table: TableSummary) => void;
}) {
  const t = useTranslations("pos.ordering");
  const format = useLocalizedFormat();
  const availableCount = tables.filter((table) => table.availability === "available").length;
  const occupiedCount = tables.filter((table) => table.availability === "occupied").length;

  if (tables.length === 0) {
    return (
      <EmptyState
        icon={TableProperties}
        title={t("noTablesTitle")}
        description={t("noTablesDescription", { branch: branchName })}
        action={
          <Button asChild variant="secondary" size="sm">
            <Link href="/tables">{t("manageTables")}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-sm text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <DoorOpen className="size-4 text-success" aria-hidden="true" />
          {t("tableCard.available")}: <strong className="text-ink">{availableCount}</strong>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-4 text-warning" aria-hidden="true" />
          {t("tableCard.occupied")}: <strong className="text-ink">{occupiedCount}</strong>
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tables.map((table) => {
          const isCurrent = table.tableId === selectedTableId;
          const mode = tableSelectionMode(table);
          const hasSession = mode === "resume";
          const blocked = mode === "blocked";

          return (
            <Card key={table.tableId} className={isCurrent ? "ring-2 ring-brand/30" : undefined}>
              <CardContent className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold tracking-tight text-ink">{table.label}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-subtle">
                      <Users className="size-3.5" aria-hidden="true" />
                      {t("tableCard.capacity", { count: table.capacity })}
                    </p>
                  </div>
                  <TableAvailabilityBadge availability={table.availability} />
                </div>

                <div className="min-h-10 text-sm text-ink-muted">
                  {hasSession && table.activeSessionOpenedAt ? (
                    <p>
                      {t("tableCard.openedAt", {
                        time: format.dateTime(table.activeSessionOpenedAt, timezone),
                      })}
                    </p>
                  ) : (
                    <p>{t("tableCard.availableDescription")}</p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  {isCurrent ? <Badge variant="brand">{t("tableCard.current")}</Badge> : <span />}
                  <Button
                    type="button"
                    variant={hasSession ? "secondary" : "primary"}
                    size="sm"
                    onClick={() => onSelect(table)}
                    disabled={isCurrent || blocked}
                  >
                    <DoorOpen />
                    {hasSession ? t("tableCard.resume") : t("tableCard.select")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
