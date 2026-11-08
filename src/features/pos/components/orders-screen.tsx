"use client";

import { Receipt, RefreshCw, TableProperties } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { DataTable, type DataTableColumn } from "@/components/data-table/data-table";
import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { useStatusLabel } from "@/i18n/use-labels";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useWorkspace } from "@/providers/workspace-provider";

import { ORDER_STATUSES, type OrderStatus, type OrderSummary } from "../contracts";
import { OrderStatusBadge } from "./pos-status-badges";

type StatusFilter = OrderStatus | "all";

export function OrdersScreen({ orders }: { orders: OrderSummary[] }) {
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");
  const statusLabel = useStatusLabel();
  const format = useLocalizedFormat();
  const router = useRouter();
  const { activeBranch, organization } = useWorkspace();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [isRefreshing, startRefresh] = useTransition();

  const visibleOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery = !normalized || order.orderReference.toLowerCase().includes(normalized);
      const matchesStatus = status === "all" || order.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [orders, query, status]);

  const stats = useMemo(() => {
    const active = orders.filter((order) =>
      ["pending", "accepted", "preparing", "ready", "served"].includes(order.status),
    ).length;
    return {
      total: orders.length,
      active,
      completed: orders.filter((order) => order.status === "completed").length,
      cancelled: orders.filter((order) => order.status === "cancelled").length,
    };
  }, [orders]);

  const columns: Array<DataTableColumn<OrderSummary>> = [
    {
      id: "reference",
      header: t("table.reference"),
      className: "min-w-[140px]",
      cell: (order) => (
        <div>
          <Link href={`/orders/${order.orderId}`} className="font-medium text-ink hover:text-brand">
            {order.orderReference}
          </Link>
          <p className="text-xs text-ink-subtle">
            {order.source === "guest" ? t("source.guest") : t("source.staff")}
          </p>
        </div>
      ),
    },
    {
      id: "status",
      header: t("table.status"),
      cell: (order) => <OrderStatusBadge status={order.status} />,
    },
    {
      id: "items",
      header: t("table.items"),
      align: "right",
      cell: (order) => (
        <span className="text-ink-muted">{t("itemCount", { count: order.activeItemCount })}</span>
      ),
    },
    {
      id: "subtotal",
      header: t("table.subtotal"),
      align: "right",
      cell: (order) => (
        <span className="font-medium text-ink">
          {format.currencyAmount(order.subtotalMinor, order.currency)}
        </span>
      ),
    },
    {
      id: "created",
      header: t("table.created"),
      className: "whitespace-nowrap",
      cell: (order) => (
        <span className="text-ink-muted">
          {format.dateTime(order.createdAt, organization.timezone)}
        </span>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">{t("table.actions")}</span>,
      align: "right",
      cell: (order) => (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/orders/${order.orderId}`}>{tCommon("view")}</Link>
        </Button>
      ),
    },
  ];

  const hasFilters = query.trim().length > 0 || status !== "all";

  return (
    <PageStack>
      <PageHeader
        title={t("title")}
        description={t("description", { branch: activeBranch.name })}
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href="/tables">
                <TableProperties />
                {t("tablesAction")}
              </Link>
            </Button>
            <Button
              variant="secondary"
              onClick={() => startRefresh(() => router.refresh())}
              isLoading={isRefreshing}
            >
              <RefreshCw />
              {t("refresh")}
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile label={t("stats.total")} value={format.number(stats.total)} />
        <SummaryTile label={t("stats.active")} value={format.number(stats.active)} tone="warning" />
        <SummaryTile
          label={t("stats.completed")}
          value={format.number(stats.completed)}
          tone="success"
        />
        <SummaryTile label={t("stats.cancelled")} value={format.number(stats.cancelled)} />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            label={t("search")}
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            wrapperClassName="sm:max-w-sm"
          />
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="sr-only">{tCommon("allStatuses")}</span>
            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
              className="h-10 w-44"
            >
              <option value="all">{tCommon("allStatuses")}</option>
              {ORDER_STATUSES.map((orderStatus) => (
                <option key={orderStatus} value={orderStatus}>
                  {statusLabel(orderStatus)}
                </option>
              ))}
            </Select>
          </label>
        </div>

        <DataTable
          data={visibleOrders}
          columns={columns}
          getRowKey={(order) => order.orderId}
          ariaLabel={t("title")}
          caption={t("title")}
          emptyState={
            <EmptyState
              bordered={false}
              compact
              icon={Receipt}
              title={hasFilters ? t("empty.filteredTitle") : t("empty.title")}
              description={hasFilters ? t("empty.filteredDescription") : t("empty.description")}
              action={
                hasFilters ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setQuery("");
                      setStatus("all");
                    }}
                  >
                    {tCommon("clearFilters")}
                  </Button>
                ) : null
              }
            />
          }
        />
      </Card>
    </PageStack>
  );
}

function SummaryTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warning" | "success";
}) {
  const toneClass =
    tone === "warning" ? "text-warning" : tone === "success" ? "text-success" : "text-ink";

  return (
    <Card className="p-4">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight ${toneClass}`}>{value}</p>
    </Card>
  );
}
