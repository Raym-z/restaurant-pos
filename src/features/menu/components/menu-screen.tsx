"use client";

import { Plus, Tags, UtensilsCrossed } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
import { useMockData } from "@/features/shared/mock-data-provider";
import { useWorkspace } from "@/providers/workspace-provider";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useStatusLabel, useTagLabel } from "@/i18n/use-labels";
import type { MenuItem, MenuItemStatus } from "../types";
import {
  availableBranchCount,
  filterMenuItems,
  localizeMenuCategory,
  localizeMenuItem,
} from "../selectors";

const PAGE_SIZE = 10;

const STATUS_BADGES: Record<MenuItemStatus, "success" | "warning" | "neutral"> = {
  available: "success",
  unavailable: "warning",
  archived: "neutral",
};

export function MenuScreen() {
  const { menuItems, menuCategories } = useMockData();
  const { branches, organization, activeBranch, setActiveBranch } = useWorkspace();
  const locale = useLocale();
  const t = useTranslations("menu");
  const tCommon = useTranslations("common");
  const statusLabel = useStatusLabel();
  const tagLabel = useTagLabel();
  const format = useLocalizedFormat();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState<MenuItemStatus | "all">("all");
  // `null` follows the workspace's active branch. Selecting "All branches"
  // stores an explicit override; a header branch change clears it again.
  const [branchOverride, setBranchOverride] = useState<string | null>(null);
  const [lastActiveBranchId, setLastActiveBranchId] = useState(activeBranch.id);
  const [page, setPage] = useState(1);

  if (lastActiveBranchId !== activeBranch.id) {
    setLastActiveBranchId(activeBranch.id);
    setBranchOverride(null);
    setPage(1);
  }

  const branchId = branchOverride ?? activeBranch.id;

  const categoryById = useMemo(
    () => new Map(menuCategories.map((category) => [category.id, category])),
    [menuCategories],
  );

  const visibleItems = filterMenuItems(menuItems, {
    query,
    categoryId,
    status,
    branchId,
    locale,
    tagLabel,
  });
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = visibleItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hasFilters =
    query.trim().length > 0 || categoryId !== "all" || status !== "all" || branchId !== "all";

  function resetPage() {
    setPage(1);
  }

  const categoriesForFilter = [...menuCategories].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );

  const columns: Array<DataTableColumn<MenuItem>> = [
    {
      id: "item",
      header: t("table.item"),
      className: "min-w-[240px]",
      cell: (item) => {
        const content = localizeMenuItem(item, locale);
        return (
          <div className="max-w-xs">
            <Link href={`/menu/items/${item.id}`} className="font-medium text-ink hover:text-brand">
              {content.name}
            </Link>
            <p className="line-clamp-1 text-xs text-ink-subtle">{content.description}</p>
            {item.tags.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {item.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tagLabel(tag)}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "category",
      header: t("table.category"),
      className: "whitespace-nowrap",
      cell: (item) => {
        const category = categoryById.get(item.categoryId);
        return (
          <span className="text-ink-muted">
            {category ? localizeMenuCategory(category, locale).name : t("uncategorized")}
          </span>
        );
      },
    },
    {
      id: "price",
      header: t("table.basePrice"),
      align: "right",
      cell: (item) => <span className="font-medium text-ink">{format.money(item.basePrice)}</span>,
    },
    {
      id: "availability",
      header: t("table.availability"),
      className: "whitespace-nowrap",
      cell: (item) => {
        const availableCount = availableBranchCount(
          item,
          branches.map((branch) => branch.id),
        );
        const hasOverride = item.branchAvailability.some((entry) => entry.priceOverride !== null);
        return (
          <div>
            <span className="text-ink">
              {t("availabilityCount", {
                available: availableCount,
                total: branches.length,
              })}
            </span>
            {hasOverride ? (
              <div className="text-xs text-ink-subtle">{t("branchPriceOverride")}</div>
            ) : null}
          </div>
        );
      },
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
        <span className="text-ink-muted">
          {format.dateOnly(item.updatedAt, organization.timezone)}
        </span>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">{t("table.actions")}</span>,
      align: "right",
      cell: (item) => (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/menu/items/${item.id}`}>{tCommon("view")}</Link>
        </Button>
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
            <Button asChild>
              <Link href="/menu/items/new">
                <Plus />
                {t("newItem")}
              </Link>
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-center">
          <SearchInput
            label={t("search")}
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              resetPage();
            }}
            wrapperClassName="sm:col-span-2 lg:col-span-1"
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
                  {localizeMenuCategory(category, locale).name}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="sr-only">{t("allStatuses")}</span>
            <Select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as MenuItemStatus | "all");
                resetPage();
              }}
              className="h-10 w-40"
            >
              <option value="all">{t("allStatuses")}</option>
              <option value="available">{statusLabel("available")}</option>
              <option value="unavailable">{statusLabel("unavailable")}</option>
              <option value="archived">{statusLabel("archived")}</option>
            </Select>
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="sr-only">{t("allBranches")}</span>
            <Select
              value={branchId}
              onChange={(event) => {
                const nextBranchId = event.target.value;
                if (nextBranchId === "all") {
                  setBranchOverride("all");
                } else {
                  setBranchOverride(null);
                  setActiveBranch(nextBranchId);
                }
                resetPage();
              }}
              className="h-10 w-44"
            >
              <option value="all">{t("allBranches")}</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
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
                      setBranchOverride("all");
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
                  <Button asChild size="sm">
                    <Link href="/menu/items/new">
                      <Plus />
                      {t("newItem")}
                    </Link>
                  </Button>
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
