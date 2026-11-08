"use client";

import { ArrowLeft, Pencil, Plus, Tags } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

import { DataTable, type DataTableColumn } from "@/components/data-table/data-table";
import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { useMockData } from "@/features/shared/mock-data-provider";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useStatusLabel } from "@/i18n/use-labels";
import type { MenuCategory } from "../types";
import { localizeMenuCategory } from "../selectors";

export function MenuCategoriesScreen() {
  const { menuCategories, menuItems } = useMockData();
  const locale = useLocale();
  const t = useTranslations("menu.categories");
  const tCommon = useTranslations("common");
  const statusLabel = useStatusLabel();
  const format = useLocalizedFormat();
  const [query, setQuery] = useState("");

  const itemCounts = new Map<string, number>();
  for (const item of menuItems) {
    itemCounts.set(item.categoryId, (itemCounts.get(item.categoryId) ?? 0) + 1);
  }

  const normalized = query.trim().toLowerCase();
  const visibleCategories = [...menuCategories]
    .filter((category) => {
      if (!normalized) {
        return true;
      }
      const content = localizeMenuCategory(category, locale);
      return (
        content.name.toLowerCase().includes(normalized) ||
        content.description.toLowerCase().includes(normalized)
      );
    })
    .sort((left, right) => left.sortOrder - right.sortOrder);

  const columns: Array<DataTableColumn<MenuCategory>> = [
    {
      id: "category",
      header: t("table.category"),
      cell: (category) => {
        const content = localizeMenuCategory(category, locale);
        return (
          <div>
            <p className="font-medium text-ink">{content.name}</p>
            <p className="max-w-md text-xs text-ink-subtle">{content.description || "—"}</p>
          </div>
        );
      },
    },
    {
      id: "items",
      header: t("table.items"),
      align: "right",
      cell: (category) => (
        <span className="text-ink">{format.number(itemCounts.get(category.id) ?? 0)}</span>
      ),
    },
    {
      id: "order",
      header: t("table.sortOrder"),
      align: "right",
      cell: (category) => (
        <span className="text-ink-muted">{format.number(category.sortOrder)}</span>
      ),
    },
    {
      id: "status",
      header: t("table.status"),
      cell: (category) => (
        <Badge variant={category.status === "active" ? "success" : "neutral"}>
          {statusLabel(category.status)}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">{t("table.actions")}</span>,
      align: "right",
      cell: (category) => (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/menu/categories/${category.id}/edit`}>
            <Pencil />
            {tCommon("edit")}
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <PageStack>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        backLink={{ href: "/menu", label: t("back") }}
        actions={
          <Button asChild>
            <Link href="/menu/categories/new">
              <Plus />
              {t("new")}
            </Link>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            label={t("search")}
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            wrapperClassName="sm:max-w-sm"
          />
          <Button asChild variant="ghost" size="sm">
            <Link href="/menu">
              <ArrowLeft />
              {t("backToItems")}
            </Link>
          </Button>
        </div>

        <DataTable
          data={visibleCategories}
          columns={columns}
          getRowKey={(category) => category.id}
          ariaLabel={t("title")}
          caption={t("title")}
          emptyState={
            <EmptyState
              bordered={false}
              compact
              icon={Tags}
              title={normalized ? t("noMatchTitle") : t("emptyTitle")}
              description={normalized ? t("noMatchDescription") : t("emptyDescription")}
              action={
                <Button asChild size="sm">
                  <Link href="/menu/categories/new">
                    <Plus />
                    {t("new")}
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
