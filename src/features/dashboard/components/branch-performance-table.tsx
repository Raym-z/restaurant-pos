"use client";

import { Store } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { EmptyState } from "@/components/states/empty-state";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { canManageBranches } from "@/features/workspace/access";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import type { StaffRole } from "@/types/roles";

import type { DashboardBranchPerformance } from "../types";

export function BranchPerformanceTable({
  rows,
  roles,
  unavailable,
}: {
  rows: DashboardBranchPerformance[];
  roles: readonly StaffRole[];
  unavailable: number;
}) {
  const t = useTranslations("dashboard.branchPerformance");
  const format = useLocalizedFormat();
  const canViewBranches = canManageBranches(roles);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-ink">{t("title")}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
        </div>
        {canViewBranches ? (
          <Link href="/branches" className="text-sm font-medium text-brand hover:text-brand-strong">
            {t("viewBranches")}
          </Link>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          bordered={false}
          compact
          icon={Store}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("branch")}</TableHead>
                <TableHead className="text-right">{t("orders")}</TableHead>
                <TableHead className="text-right">{t("activeOrders")}</TableHead>
                <TableHead className="text-right">{t("activeSessions")}</TableHead>
                <TableHead>{t("occupancy")}</TableHead>
                <TableHead className="text-right">{t("tables")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.branchId}>
                  <TableCell>
                    <div className="font-medium text-ink">{row.branchName}</div>
                    <div className="text-xs text-ink-subtle">{row.timezone}</div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {format.number(row.totalOrders)}
                  </TableCell>
                  <TableCell className="text-right">{format.number(row.activeOrders)}</TableCell>
                  <TableCell className="text-right">{format.number(row.activeSessions)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-muted">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${Math.round(row.occupancyRate * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-ink-muted">
                        {format.percent(row.occupancyRate)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-ink-muted">
                    {t("tableCount", {
                      occupied: row.occupiedTables,
                      total: row.totalTables,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <div className="border-t border-line px-5 py-3 text-xs text-ink-subtle">
        <p>{t("scopeNote")}</p>
        {unavailable > 0 ? (
          <p className="mt-1">{t("unavailableNote", { count: unavailable })}</p>
        ) : null}
      </div>
    </Card>
  );
}
