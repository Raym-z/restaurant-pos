"use client";

import { Archive, CircleCheck, Plus, Tags, UtensilsCrossed } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";

import { DataTable, type DataTableColumn } from "@/components/data-table/data-table";
import { TablePagination } from "@/components/data-table/table-pagination";
import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useStatusLabel } from "@/i18n/use-labels";

import type { MenuItemView, MenuOverviewData, MenuStatus } from "../models";
import { MenuReadOnlyNotice } from "./menu-read-only-notice";

const PAGE_SIZE = 10;

const STATUS_BADGES: Record<MenuStatus, "success" | "neutral"> = {
  active: "success",
  archived: "neutral",
};

export function MenuScreen({ data }: { data: MenuOverviewData }) {
  const t = useTranslations("menuAdmin");
  const tCommon = useTranslations("common");
  const statusLabel = useStatusLabel();
  const format = useLocalizedFormat();

  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState<MenuStatus | "all">("all");
  const [page, setPage] = useState(1);

  const activeItems = data.items.filter((item) => item.status === "active").length;
  const archivedItems = data.items.length - activeItems;

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.items.filter((item) => {
      const matchesQuery =
        !normalized ||
        item.name.toLowerCase().includes(normalized) ||
        (item.description ?? "").toLowerCase().includes(normalized) ||
        (item.categoryName ?? "").toLowerCase().includes(normalized);
      const matchesCategory = categoryId === "all" || item.categoryId === categoryId;
      const matchesStatus = status === "all" || item.status === status;
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [categoryId, data.items, query, status]);

  const totalPages = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = visibleItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hasFilters = query.trim().length > 0 || categoryId !== "all" || status !== "all";

  const categoriesForFilter = useMemo(
    () => [...data.categories].sort((left, right) => left.sortOrder - right.sortOrder),
    [data.categories],
  );

  function resetPage() {
    setPage(1);
  }

  const columns: Array<DataTableColumn<MenuItemView>> = [
    {
      id: "item",
      header: t("table.item"),
      className: "min-w-[240px]",
      cell: (item) => (
        <div className="max-w-xs">
          <Link href={`/menu/items/${item.id}`} className="font-medium text-ink hover:text-brand">
            {item.name}
          </Link>
          <p className="line-clamp-1 text-xs text-ink-subtle">
            {item.description || t("item.noDescription")}
          </p>
        </div>
      ),
    },
    {
      id: "category",
      header: t("table.category"),
      className: "whitespace-nowrap",
      cell: (item) => (
        <span className="inline-flex flex-wrap items-center gap-2 text-ink-muted">
          {item.categoryName ?? t("uncategorized")}
          {item.categoryArchived ? (
            <Badge variant="neutral">{statusLabel("archived")}</Badge>
          ) : null}
        </span>
      ),
    },
    {
      id: "price",
      header: t("table.basePrice"),
      align: "right",
      cell: (item) => (
        <span className="font-medium text-ink">
          {format.currencyAmount(item.basePriceMinor, item.currency)}
        </span>
      ),
    },
    {
      id: "availability",
      header: t("table.availability"),
      className: "whitespace-nowrap",
      cell: (item) => (
        <div>
          <span className="text-ink">
            {t("availabilityCount", {
              available: item.availableBranchCount,
              total: data.branches.length,
            })}
          </span>
          {item.hasPriceOverride ? (
            <div className="text-xs text-ink-subtle">{t("branchPriceOverride")}</div>
          ) : null}
        </div>
      ),
    },
    {
      id: "status",
      header: t("table.status"),
      cell: (item) => (
        <Badge variant={STATUS_BADGES[item.status]}>{statusLabel(item.status)}</Badge>
      ),
    },
    {
      id: "updated",
      header: t("table.updated"),
      cell: (item) => (
        <span className="text-ink-muted">{format.dateOnly(item.updatedAt, data.timezone)}</span>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">{t("table.actions")}</span>,
      align: "right",
      cell: (item) => (
        <div className="flex justify-end gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/menu/items/${item.id}`}>{tCommon("view")}</Link>
          </Button>
          {data.canManage && item.status === "active" ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/menu/items/${item.id}/edit`}>{tCommon("edit")}</Link>
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <PageStack>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href="/menu/categories">
                <Tags />
                {t("categoriesAction")}
              </Link>
            </Button>
            {data.canManage ? (
              <Button asChild>
                <Link href="/menu/items/new">
                  <Plus />
                  {t("newItem")}
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      {!data.canManage ? <MenuReadOnlyNotice /> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("stats.categories")}
          value={format.number(data.categories.length)}
          icon={Tags}
          description={t("stats.categoriesDescription")}
        />
        <StatCard
          label={t("stats.items")}
          value={format.number(data.items.length)}
          icon={UtensilsCrossed}
          description={t("stats.itemsDescription")}
        />
        <StatCard
          label={t("stats.activeItems")}
          value={format.number(activeItems)}
          icon={CircleCheck}
          description={t("stats.activeItemsDescription")}
        />
        <StatCard
          label={t("stats.archivedItems")}
          value={format.number(archivedItems)}
          icon={Archive}
          description={t("stats.archivedItemsDescription")}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
          <SearchInput
            label={t("searchItems")}
            placeholder={t("searchItemsPlaceholder")}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              resetPage();
            }}
          />
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="sr-only">{t("allCategories")}</span>
            <Select
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                resetPage();
              }}
              className="h-10 w-44"
            >
              <option value="all">{t("allCategories")}</option>
              {categoriesForFilter.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="sr-only">{t("allStatuses")}</span>
            <Select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as MenuStatus | "all");
                resetPage();
              }}
              className="h-10 w-40"
            >
              <option value="all">{t("allStatuses")}</option>
              <option value="active">{statusLabel("active")}</option>
              <option value="archived">{statusLabel("archived")}</option>
            </Select>
          </label>
        </div>

        <DataTable
          data={pageRows}
          columns={columns}
          getRowKey={(item) => item.id}
          ariaLabel={t("title")}
          caption={t("title")}
          emptyState={
            hasFilters ? (
              <EmptyState
                bordered={false}
                compact
                icon={UtensilsCrossed}
                title={t("empty.filteredTitle")}
                description={t("empty.filteredDescription")}
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setQuery("");
                      setCategoryId("all");
                      setStatus("all");
                      resetPage();
                    }}
                  >
                    {tCommon("clearFilters")}
                  </Button>
                }
              />
            ) : (
              <EmptyState
                bordered={false}
                compact
                icon={UtensilsCrossed}
                title={t("empty.title")}
                description={t("empty.description")}
                action={
                  data.canManage ? (
                    <Button asChild size="sm">
                      <Link
                        href={
                          data.categories.length === 0 ? "/menu/categories/new" : "/menu/items/new"
                        }
                      >
                        <Plus />
                        {data.categories.length === 0 ? t("newCategory") : t("newItem")}
                      </Link>
                    </Button>
                  ) : undefined
                }
              />
            )
          }
        />

        {visibleItems.length > 0 ? (
          <TablePagination
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={visibleItems.length}
            onPageChange={setPage}
            itemLabel={tCommon("menuItems")}
          />
        ) : null}
      </Card>
    </PageStack>
  );
}
