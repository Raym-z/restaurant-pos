"use client";

import { ArrowLeft, Pencil, Plus, Tags } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";

import { DataTable, type DataTableColumn } from "@/components/data-table/data-table";
import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useStatusLabel } from "@/i18n/use-labels";

import type { MenuCategoryView, MenuOverviewData, MenuStatus } from "../models";
import { ArchiveMenuDialog } from "./archive-menu-dialog";
import { MenuReadOnlyNotice } from "./menu-read-only-notice";

const STATUS_BADGES: Record<MenuStatus, "success" | "neutral"> = {
  active: "success",
  archived: "neutral",
};

export function MenuCategoriesScreen({ data }: { data: MenuOverviewData }) {
  const t = useTranslations("menuAdmin");
  const tCommon = useTranslations("common");
  const statusLabel = useStatusLabel();
  const format = useLocalizedFormat();
  const [query, setQuery] = useState("");

  const normalized = query.trim().toLowerCase();
  const visibleCategories = useMemo(
    () =>
      [...data.categories]
        .filter((category) => {
          if (!normalized) {
            return true;
          }
          return (
            category.name.toLowerCase().includes(normalized) ||
            (category.description ?? "").toLowerCase().includes(normalized)
          );
        })
        .sort((left, right) => left.sortOrder - right.sortOrder),
    [data.categories, normalized],
  );

  const columns: Array<DataTableColumn<MenuCategoryView>> = [
    {
      id: "category",
      header: t("table.category"),
      cell: (category) => (
        <div>
          <p className="font-medium text-ink">{category.name}</p>
          <p className="max-w-md text-xs text-ink-subtle">
            {category.description || t("item.noDescription")}
          </p>
        </div>
      ),
    },
    {
      id: "items",
      header: t("table.items"),
      align: "right",
      cell: (category) => (
        <span className="text-ink">
          {format.number(category.activeItemCount)}
          {category.itemCount !== category.activeItemCount
            ? ` / ${format.number(category.itemCount)}`
            : ""}
        </span>
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
        <Badge variant={STATUS_BADGES[category.status]}>{statusLabel(category.status)}</Badge>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">{t("table.actions")}</span>,
      align: "right",
      cell: (category) =>
        data.canManage && category.status === "active" ? (
          <div className="flex justify-end gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/menu/categories/${category.id}/edit`}>
                <Pencil />
                {tCommon("edit")}
              </Link>
            </Button>
            <ArchiveMenuDialog
              kind="category"
              id={category.id}
              name={category.name}
              redirectTo="/menu/categories"
            />
          </div>
        ) : (
          <span className="text-xs text-ink-subtle">—</span>
        ),
    },
  ];

  return (
    <PageStack>
      <PageHeader
        title={t("categories.title")}
        description={t("categories.description")}
        backLink={{ href: "/menu", label: t("backToMenu") }}
        actions={
          data.canManage ? (
            <Button asChild>
              <Link href="/menu/categories/new">
                <Plus />
                {t("newCategory")}
              </Link>
            </Button>
          ) : undefined
        }
      />

      {!data.canManage ? <MenuReadOnlyNotice /> : null}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            label={t("searchCategories")}
            placeholder={t("searchCategoriesPlaceholder")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            wrapperClassName="sm:max-w-sm"
          />
          <Button asChild variant="ghost" size="sm">
            <Link href="/menu">
              <ArrowLeft />
              {t("categories.backToItems")}
            </Link>
          </Button>
        </div>

        <DataTable
          data={visibleCategories}
          columns={columns}
          getRowKey={(category) => category.id}
          ariaLabel={t("categories.title")}
          caption={t("categories.title")}
          emptyState={
            <EmptyState
              bordered={false}
              compact
              icon={Tags}
              title={normalized ? t("empty.categoriesFilteredTitle") : t("empty.categoriesTitle")}
              description={
                normalized
                  ? t("empty.categoriesFilteredDescription")
                  : t("empty.categoriesDescription")
              }
              action={
                !normalized && data.canManage ? (
                  <Button asChild size="sm">
                    <Link href="/menu/categories/new">
                      <Plus />
                      {t("newCategory")}
                    </Link>
                  </Button>
                ) : undefined
              }
            />
          }
        />
      </Card>
    </PageStack>
  );
}
