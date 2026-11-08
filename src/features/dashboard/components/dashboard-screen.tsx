"use client";

import { useLocale, useTranslations } from "next-intl";

import { PageHeader, PageStack } from "@/components/layout/page";
import { useMockData } from "@/features/shared/mock-data-provider";
import { useWorkspace } from "@/providers/workspace-provider";
import { localizeMenuCategory, localizeMenuItem } from "@/features/menu/selectors";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { mockDashboard } from "../data/dashboard";
import { AttentionList } from "./attention-list";
import { BranchPerformanceTable } from "./branch-performance-table";
import { MetricCard } from "./metric-card";
import { OperationalSnapshot } from "./operational-snapshot";
import { RecentOrdersTable } from "./recent-orders-table";
import { SalesTrend } from "./sales-trend";
import { TopSellingItems } from "./top-selling-items";

export function DashboardScreen() {
  const { organization, branches } = useWorkspace();
  const { menuItems, menuCategories } = useMockData();
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const format = useLocalizedFormat();
  const openBranchCount = branches.filter((branch) => branch.status === "active").length;

  const topSellingItems = mockDashboard.topSellingItems.map((entry) => {
    const menuItem = menuItems.find((item) => item.id === entry.menuItemId);
    const category = menuItem
      ? menuCategories.find((item) => item.id === menuItem.categoryId)
      : undefined;
    return {
      ...entry,
      name: menuItem ? localizeMenuItem(menuItem, locale).name : entry.name,
      categoryName: category ? localizeMenuCategory(category, locale).name : entry.categoryName,
    };
  });

  return (
    <PageStack>
      <PageHeader
        title={t("title")}
        description={`${organization.name} · ${t("openBranches", {
          count: openBranchCount,
        })}`}
        actions={
          <p className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-muted">
            {t("asOf", {
              date: format.dateTime(mockDashboard.asOf, organization.timezone),
            })}
          </p>
        }
      />

      <section aria-label={t("metricsLabel")}>
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
        <TopSellingItems items={topSellingItems} />
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
    </PageStack>
  );
}
