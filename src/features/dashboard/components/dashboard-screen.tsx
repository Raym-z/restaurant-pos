"use client";

import {
  Building2,
  CheckCircle2,
  Clock,
  Coins,
  DoorOpen,
  MapPin,
  Receipt,
  ShieldCheck,
  TableProperties,
  Users,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { PageHeader, PageStack } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useRoleLabel } from "@/i18n/use-labels";
import { useWorkspace } from "@/providers/workspace-provider";

import type { DashboardData, DashboardViewer } from "../types";
import { BranchPerformanceTable } from "./branch-performance-table";
import { DashboardFilters } from "./dashboard-filters";
import { OperationalAlerts } from "./operational-alerts";
import { OrderActivity } from "./order-activity";
import { RecentOrdersTable } from "./recent-orders-table";
import { SalesAvailability } from "./sales-availability";
import { TableUtilization } from "./table-utilization";

export function DashboardScreen({
  data,
  viewer,
}: {
  data: DashboardData;
  viewer: DashboardViewer;
}) {
  const { organization, primaryRole, branches, activeBranch } = useWorkspace();
  const t = useTranslations("dashboard");
  const tSummary = useTranslations("dashboard.summary");
  const tMetrics = useTranslations("dashboard.metrics");
  const format = useLocalizedFormat();
  const roleLabel = useRoleLabel();

  const summary = [
    {
      id: "organization",
      label: tSummary("organization"),
      value: organization.name,
      icon: Building2,
    },
    {
      id: "branches",
      label: tSummary("accessibleBranches"),
      value: format.number(branches.length),
      icon: MapPin,
    },
    {
      id: "branch",
      label: tSummary("activeBranch"),
      value: activeBranch.name,
      icon: MapPin,
    },
    {
      id: "role",
      label: tSummary("primaryRole"),
      value: roleLabel(primaryRole),
      icon: ShieldCheck,
    },
  ];

  const snapshot = data.current;
  const averageOrderValue =
    snapshot.averageOrderValueMinor === null
      ? t("noValue")
      : format.currencyAmount(snapshot.averageOrderValueMinor, snapshot.currency);

  return (
    <PageStack>
      <PageHeader
        title={t("title")}
        description={`${organization.name} · ${t("openBranches", {
          count: branches.filter((branch) => branch.status === "active").length,
        })}`}
        actions={
          <Badge variant="outline">
            {t("filters.asOf", {
              date: format.dateTime(data.asOf, viewer.timezone),
            })}
          </Badge>
        }
      />

      <DashboardFilters data={data} viewer={viewer} />

      <section aria-label={tSummary("label")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.id} className="p-5">
                <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-ink-subtle uppercase">
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </div>
                <p className="mt-2 truncate text-lg font-semibold text-ink">{item.value}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section aria-label={t("metricsLabel")}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={tMetrics("totalOrders")}
            value={format.number(snapshot.totalOrders)}
            icon={Receipt}
            description={tMetrics("totalOrdersHint")}
          />
          <StatCard
            label={tMetrics("activeOrders")}
            value={format.number(snapshot.activeOrders)}
            icon={Clock}
            description={tMetrics("activeOrdersHint")}
          />
          <StatCard
            label={tMetrics("completedOrders")}
            value={format.number(snapshot.completedOrders)}
            icon={CheckCircle2}
            description={tMetrics("completedOrdersHint")}
          />
          <StatCard
            label={tMetrics("cancelledOrders")}
            value={format.number(snapshot.cancelledOrders)}
            icon={XCircle}
            description={tMetrics("cancelledOrdersHint")}
          />
          <StatCard
            label={tMetrics("activeSessions")}
            value={format.number(snapshot.activeSessions)}
            icon={Users}
            description={tMetrics("activeSessionsHint")}
          />
          <StatCard
            label={tMetrics("occupiedTables")}
            value={format.number(snapshot.occupiedTables)}
            icon={TableProperties}
            description={tMetrics("occupiedTablesHint")}
          />
          <StatCard
            label={tMetrics("availableTables")}
            value={format.number(snapshot.availableTables)}
            icon={DoorOpen}
            description={tMetrics("availableTablesHint")}
          />
          <StatCard
            label={tMetrics("averageOrderValue")}
            value={averageOrderValue}
            icon={Coins}
            description={tMetrics("averageOrderValueHint")}
          />
        </div>
      </section>

      <SalesAvailability />

      <div className="grid gap-4 xl:grid-cols-2">
        <OrderActivity snapshot={snapshot} />
        <TableUtilization snapshot={snapshot} />
      </div>

      <RecentOrdersTable
        orders={snapshot.recentOrders}
        timeZone={snapshot.timezone}
        truncated={snapshot.ordersTruncated}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <BranchPerformanceTable
            rows={data.branchPerformance}
            roles={viewer.roles}
            unavailable={data.branchPerformanceUnavailable}
          />
        </div>
        <OperationalAlerts alerts={data.alerts} roles={viewer.roles} />
      </div>
    </PageStack>
  );
}
