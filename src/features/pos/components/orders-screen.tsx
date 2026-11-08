"use client";

import { ChevronLeft, ChevronRight, Receipt, RefreshCw, TableProperties } from "lucide-react";
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

import { ORDER_STATUSES, type BranchOrderListResponse, type OrderStatus } from "../contracts";
import { ordersPageHref } from "../orders-pagination";
import { OrderStatusBadge } from "./pos-status-badges";

type StatusFilter = OrderStatus | "all";

export function OrdersScreen({
  data,
  page,
  status,
}: {
  data: BranchOrderListResponse;
  page: number;
  status?: OrderStatus;
}) {
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");
  const statusLabel = useStatusLabel();
  const format = useLocalizedFormat();
  const router = useRouter();
  const { activeBranch } = useWorkspace();
  const [query, setQuery] = useState("");
  const [isNavigating, startNavigation] = useTransition();
  const [isRefreshing, startRefresh] = useTransition();

  const visibleOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.orders.filter(
      (order) => !normalized || order.orderReference.toLowerCase().includes(normalized),
    );
  }, [data.orders, query]);

  const stats = useMemo(() => {
    const active = data.orders.filter((order) =>
      ["pending", "accepted", "preparing", "ready", "served"].includes(order.status),
    ).length;
    return {
      total: data.orders.length,
      active,
      completed: data.orders.filter((order) => order.status === "completed").length,
      cancelled: data.orders.filter((order) => order.status === "cancelled").length,
    };
  }, [data.orders]);

  const columns: Array<DataTableColumn<BranchOrderListResponse["orders"][number]>> = [
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
      header: t("table.payableSubtotal"),
      align: "right",
      cell: (order) => (
        <div>
          <p className="font-medium text-ink">
            {format.currencyAmount(order.payableSubtotalMinor, order.currency)}
          </p>
          {order.status === "cancelled" ? (
            <p className="text-xs text-ink-subtle">
              {t("historicalSubtotal", {
                amount: format.currencyAmount(order.subtotalMinor, order.currency),
              })}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "created",
      header: t("table.created"),
      className: "whitespace-nowrap",
      cell: (order) => (
        <span className="text-ink-muted">
          {format.dateTime(order.createdAt, activeBranch.timezone)}
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

  const hasFilters = query.trim().length > 0 || status !== undefined;

  function changeStatus(next: StatusFilter) {
    startNavigation(() => {
      router.push(
        ordersPageHref({
          page: 1,
          status: next === "all" ? undefined : next,
        }),
      );
    });
  }

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
        <SummaryTile label={t("stats.pageTotal")} value={format.number(stats.total)} />
        <SummaryTile
          label={t("stats.pageActive")}
          value={format.number(stats.active)}
          tone="warning"
        />
        <SummaryTile
          label={t("stats.pageCompleted")}
          value={format.number(stats.completed)}
          tone="success"
        />
        <SummaryTile label={t("stats.pageCancelled")} value={format.number(stats.cancelled)} />
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
              value={status ?? "all"}
              onChange={(event) => changeStatus(event.target.value as StatusFilter)}
              className="h-10 w-44"
              disabled={isNavigating}
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
                      startNavigation(() => router.push("/orders"));
                    }}
                  >
                    {tCommon("clearFilters")}
                  </Button>
                ) : null
              }
            />
          }
        />

        <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-muted">{t("page", { page })}</p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Button asChild variant="secondary" size="sm">
                <Link href={ordersPageHref({ page: page - 1, status })}>
                  <ChevronLeft />
                  {tCommon("previous")}
                </Link>
              </Button>
            ) : (
              <Button variant="secondary" size="sm" disabled>
                <ChevronLeft />
                {tCommon("previous")}
              </Button>
            )}
            {data.hasMore ? (
              <Button asChild variant="secondary" size="sm">
                <Link href={ordersPageHref({ page: page + 1, status })}>
                  {tCommon("next")}
                  <ChevronRight />
                </Link>
              </Button>
            ) : (
              <Button variant="secondary" size="sm" disabled>
                {tCommon("next")}
                <ChevronRight />
              </Button>
            )}
          </div>
        </div>
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
