"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Pencil, Plus, Tags } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/data-table/data-table";
import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { useMockData } from "@/features/shared/mock-data-provider";
import type { MenuCategory } from "../types";
import { MENU_CATEGORY_STATUS_LABELS } from "../types";

export function MenuCategoriesScreen() {
  const { menuCategories, menuItems } = useMockData();
  const [query, setQuery] = useState("");

  const itemCounts = new Map<string, number>();
  for (const item of menuItems) {
    itemCounts.set(item.categoryId, (itemCounts.get(item.categoryId) ?? 0) + 1);
  }

  const normalized = query.trim().toLowerCase();
  const visibleCategories = [...menuCategories]
    .filter((category) =>
      normalized
        ? category.name.toLowerCase().includes(normalized) ||
          category.description.toLowerCase().includes(normalized)
        : true,
    )
    .sort((left, right) => left.sortOrder - right.sortOrder);

  const columns: Array<DataTableColumn<MenuCategory>> = [
    {
      id: "category",
      header: "Category",
      cell: (category) => (
        <div>
          <p className="font-medium text-ink">{category.name}</p>
          <p className="max-w-md text-xs text-ink-subtle">
            {category.description || "No description"}
          </p>
        </div>
      ),
    },
    {
      id: "items",
      header: "Items",
      align: "right",
      cell: (category) => <span className="text-ink">{itemCounts.get(category.id) ?? 0}</span>,
    },
    {
      id: "order",
      header: "Sort order",
      align: "right",
      cell: (category) => <span className="text-ink-muted">{category.sortOrder}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: (category) => (
        <Badge variant={category.status === "active" ? "success" : "neutral"}>
          {MENU_CATEGORY_STATUS_LABELS[category.status]}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (category) => (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/menu/categories/${category.id}/edit`}>
            <Pencil />
            Edit
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <PageStack>
      <PageHeader
        eyebrow="Menu"
        title="Categories"
        description="Organize menu items into the categories shown across branches."
        backLink={{ href: "/menu", label: "Back to menu" }}
        actions={
          <Button asChild>
            <Link href="/menu/categories/new">
              <Plus />
              New category
            </Link>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            label="Search categories"
            placeholder="Search by category name or description"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            wrapperClassName="sm:max-w-sm"
          />
          <Button asChild variant="ghost" size="sm">
            <Link href="/menu">
              <ArrowLeft />
              Back to items
            </Link>
          </Button>
        </div>

        <DataTable
          data={visibleCategories}
          columns={columns}
          getRowKey={(category) => category.id}
          ariaLabel="Menu categories"
          caption="Menu categories"
          emptyState={
            <EmptyState
              bordered={false}
              compact
              icon={Tags}
              title={normalized ? "No categories match" : "No categories yet"}
              description={
                normalized
                  ? "Try a different search term."
                  : "Create the first category before adding menu items."
              }
              action={
                <Button asChild size="sm">
                  <Link href="/menu/categories/new">
                    <Plus />
                    New category
                  </Link>
                </Button>
              }
            />
          }
        />
      </Card>
    </PageStack>
  );
}
