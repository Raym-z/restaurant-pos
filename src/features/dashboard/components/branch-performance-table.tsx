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
import { BRANCH_STATUS_LABELS } from "@/features/branches/types";
import {
  formatMoney,
  formatNumber,
  formatPercent,
  formatSignedPercent,
} from "@/features/shared/format";
import type { Branch } from "@/features/branches/types";
import type { BranchPerformance } from "../types";

interface BranchPerformanceTableProps {
  rows: BranchPerformance[];
  branches: Branch[];
}

export function BranchPerformanceTable({ rows, branches }: BranchPerformanceTableProps) {
  const branchById = new Map(branches.map((branch) => [branch.id, branch]));

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Branch performance</h2>
          <p className="text-sm text-ink-muted">Today&apos;s sales by branch</p>
        </div>
        <Link href="/branches" className="text-sm font-medium text-brand hover:text-brand-strong">
          View branches
        </Link>
      </div>
      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Branch</TableHead>
              <TableHead className="text-right">Net sales</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Avg. order</TableHead>
              <TableHead>Revenue share</TableHead>
              <TableHead className="text-right">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const branch = branchById.get(row.branchId);
              const isOpen = branch?.status === "active";
              return (
                <TableRow key={row.branchId}>
                  <TableCell>
                    <div className="font-medium text-ink">{branch?.name ?? "Unknown branch"}</div>
                    <div className="text-xs text-ink-subtle">
                      {branch ? `${branch.code} · ${BRANCH_STATUS_LABELS[branch.status]}` : "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {isOpen ? formatMoney(row.revenue) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {isOpen ? formatNumber(row.orders) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {isOpen ? formatMoney(row.averageOrderValue) : "—"}
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
                          {formatPercent(row.revenueShare)}
                        </span>
                      </div>
                    ) : (
                      <Badge variant="neutral">Not open yet</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isOpen ? (
                      <span className={row.changeRatio >= 0 ? "text-success" : "text-danger"}>
                        {formatSignedPercent(row.changeRatio)}
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
