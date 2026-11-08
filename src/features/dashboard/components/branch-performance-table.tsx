"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
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
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useStatusLabel } from "@/i18n/use-labels";
import type { Branch } from "@/features/branches/types";
import type { BranchPerformance } from "../types";

interface BranchPerformanceTableProps {
  rows: BranchPerformance[];
  branches: Branch[];
}

export function BranchPerformanceTable({ rows, branches }: BranchPerformanceTableProps) {
  const t = useTranslations("dashboard.branchPerformance");
  const tCommon = useTranslations("common");
  const statusLabel = useStatusLabel();
  const format = useLocalizedFormat();
  const branchById = new Map(branches.map((branch) => [branch.id, branch]));

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-ink">{t("title")}</h2>
          <p className="text-sm text-ink-muted">{t("subtitle")}</p>
        </div>
        <Link href="/branches" className="text-sm font-medium text-brand hover:text-brand-strong">
          {t("viewBranches")}
        </Link>
      </div>
      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("branch")}</TableHead>
              <TableHead className="text-right">{t("netSales")}</TableHead>
              <TableHead className="text-right">{t("orders")}</TableHead>
              <TableHead className="text-right">{t("averageOrder")}</TableHead>
              <TableHead>{t("revenueShare")}</TableHead>
              <TableHead className="text-right">{t("change")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const branch = branchById.get(row.branchId);
              const isOpen = branch?.status === "active";
              return (
                <TableRow key={row.branchId}>
                  <TableCell>
                    <div className="font-medium text-ink">{branch?.name ?? t("unknownBranch")}</div>
                    <div className="text-xs text-ink-subtle">
                      {branch ? `${branch.timezone} · ${statusLabel(branch.status)}` : "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {isOpen ? format.money(row.revenue) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {isOpen ? format.number(row.orders) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {isOpen ? format.money(row.averageOrderValue) : "—"}
                  </TableCell>
                  <TableCell>
                    {isOpen ? (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-muted">
                          <div
                            className="h-full rounded-full bg-brand"
                            style={{
                              width: `${Math.round(row.revenueShare * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-ink-muted">
                          {format.percent(row.revenueShare)}
                        </span>
                      </div>
                    ) : (
                      <Badge variant="neutral">{tCommon("notOpenYet")}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isOpen ? (
                      <span className={row.changeRatio >= 0 ? "text-success" : "text-danger"}>
                        {format.signedPercent(row.changeRatio)}
                      </span>
                    ) : (
                      <span className="text-ink-subtle">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
