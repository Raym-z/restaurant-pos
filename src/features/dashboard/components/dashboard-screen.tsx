"use client";

import { formatDateTime } from "@/features/shared/format";
import { useMockData } from "@/features/shared/mock-data-provider";
import { mockDashboard } from "../data/dashboard";
import { AttentionList } from "./attention-list";
import { BranchPerformanceTable } from "./branch-performance-table";
import { MetricCard } from "./metric-card";
import { OperationalSnapshot } from "./operational-snapshot";
import { RecentOrdersTable } from "./recent-orders-table";
import { SalesTrend } from "./sales-trend";
import { TopSellingItems } from "./top-selling-items";

export function DashboardScreen() {
  const { organization, branches } = useMockData();
  const openBranchCount = branches.filter((branch) => branch.status === "active").length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {organization.name} · {openBranchCount} open{" "}
            {openBranchCount === 1 ? "branch" : "branches"}
          </p>
        </div>
        <p className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-muted">
          As of {formatDateTime(mockDashboard.asOf, organization.timezone)}
        </p>
      </header>

      <section aria-label="Key metrics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {mockDashboard.metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesTrend points={mockDashboard.salesTrend} currency={organization.currency} />
        </div>
        <OperationalSnapshot snapshot={mockDashboard.operationalSnapshot} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <BranchPerformanceTable rows={mockDashboard.branchPerformance} branches={branches} />
        </div>
        <TopSellingItems items={mockDashboard.topSellingItems} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentOrdersTable
            orders={mockDashboard.recentOrders}
            branches={branches}
            timeZone={organization.timezone}
          />
        </div>
        <AttentionList items={mockDashboard.attentionItems} branches={branches} />
      </div>
    </div>
  );
}
