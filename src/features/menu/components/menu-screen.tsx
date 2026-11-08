"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Tags, UtensilsCrossed } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/data-table/data-table";
import { TablePagination } from "@/components/data-table/table-pagination";
import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { formatDateOnly, formatMoney } from "@/features/shared/format";
import { useMockData } from "@/features/shared/mock-data-provider";
import type { MenuItem, MenuItemStatus } from "../types";
import { MENU_ITEM_STATUS_LABELS } from "../types";
import { filterMenuItems } from "../selectors";

const PAGE_SIZE = 10;

const STATUS_BADGES: Record<MenuItemStatus, "success" | "warning" | "neutral"> = {
  available: "success",
  unavailable: "warning",
  archived: "neutral",
};

export function MenuScreen() {
  const { menuItems, menuCategories, branches, organization } = useMockData();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState<MenuItemStatus | "all">("all");
  const [branchId, setBranchId] = useState("all");
  const [page, setPage] = useState(1);

  const categoryById = useMemo(
    () => new Map(menuCategories.map((category) => [category.id, category])),
    [menuCategories],
  );

  const visibleItems = filterMenuItems(menuItems, {
    query,
    categoryId,
    status,
    branchId,
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
      header: "Menu item",
      className: "min-w-[240px]",
      cell: (item) => (
        <div className="max-w-xs">
          <Link href={`/menu/items/${item.id}`} className="font-medium text-ink hover:text-brand">
            {item.name}
          </Link>
          <p className="line-clamp-1 text-xs text-ink-subtle">{item.description}</p>
          {item.tags.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {item.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      id: "category",
      header: "Category",
      className: "whitespace-nowrap",
      cell: (item) => (
        <span className="text-ink-muted">
          {categoryById.get(item.categoryId)?.name ?? "Uncategorized"}
        </span>
      ),
    },
    {
      id: "price",
      header: "Base price",
      align: "right",
      cell: (item) => <span className="font-medium text-ink">{formatMoney(item.basePrice)}</span>,
    },
    {
      id: "availability",
      header: "Availability",
      className: "whitespace-nowrap",
      cell: (item) => {
        const availableCount = item.branchAvailability.filter((entry) => entry.isAvailable).length;
        const hasOverride = item.branchAvailability.some((entry) => entry.priceOverride !== null);
        return (
          <div>
            <span className="text-ink">
              {availableCount} of {branches.length} branches
            </span>
            {hasOverride ? (
              <div className="text-xs text-ink-subtle">Branch price override</div>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: (item) => (
        <Badge variant={STATUS_BADGES[item.status]}>{MENU_ITEM_STATUS_LABELS[item.status]}</Badge>
      ),
    },
    {
      id: "updated",
      header: "Updated",
      cell: (item) => (
        <span className="text-ink-muted">
          {formatDateOnly(item.updatedAt, organization.timezone)}
        </span>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (item) => (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/menu/items/${item.id}`}>View</Link>
        </Button>
      ),
    },
  ];

  return (
    <PageStack>
      <PageHeader
        title="Menu"
        description="Manage categories, pricing, tags, and branch availability."
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href="/menu/categories">
                <Tags />
                Categories
              </Link>
            </Button>
            <Button asChild>
              <Link href="/menu/items/new">
                <Plus />
                New item
              </Link>
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-center">
          <SearchInput
            label="Search menu items"
            placeholder="Search by item name, description, or tag"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              resetPage();
            }}
            wrapperClassName="sm:col-span-2 lg:col-span-1"
          />
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="sr-only">Category filter</span>
            <Select
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                resetPage();
              }}
              className="h-10 w-44"
            >
              <option value="all">All categories</option>
              {categoriesForFilter.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="sr-only">Status filter</span>
            <Select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as MenuItemStatus | "all");
                resetPage();
              }}
              className="h-10 w-40"
            >
              <option value="all">All statuses</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
              <option value="archived">Archived</option>
            </Select>
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="sr-only">Branch filter</span>
            <Select
              value={branchId}
              onChange={(event) => {
                setBranchId(event.target.value);
                resetPage();
              }}
              className="h-10 w-44"
            >
              <option value="all">All branches</option>
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
          ariaLabel="Menu items"
          caption="Menu items"
          emptyState={
            hasFilters ? (
              <EmptyState
                bordered={false}
                compact
                icon={UtensilsCrossed}
                title="No menu items match these filters"
                description="Try a different search term, category, or availability filter."
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setQuery("");
                      setCategoryId("all");
                      setStatus("all");
                      setBranchId("all");
                      resetPage();
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                bordered={false}
                compact
                icon={UtensilsCrossed}
                title="No menu items yet"
                description="Create the first menu item for this organization."
                action={
                  <Button asChild size="sm">
                    <Link href="/menu/items/new">
                      <Plus />
                      New item
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
            itemLabel="menu items"
          />
        ) : null}
      </Card>
    </PageStack>
  );
}
