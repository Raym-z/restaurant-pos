"use client";

import { useTranslations } from "next-intl";

import { PageHeader, PageStack } from "@/components/layout/page";

import type { MenuCategoryView, MenuItemView } from "../models";
import { MenuItemForm } from "./menu-item-form";

export function MenuItemEditScreen({
  item,
  items,
  categories,
  currency,
  canManage,
}: {
  item: MenuItemView;
  items: MenuItemView[];
  categories: MenuCategoryView[];
  currency: string;
  canManage: boolean;
}) {
  const t = useTranslations("menuAdmin");

  return (
    <PageStack>
      <PageHeader
        title={t("form.editItemTitle", { name: item.name })}
        description={t("form.editItemDescription")}
        backLink={{ href: `/menu/items/${item.id}`, label: t("item.back") }}
      />
      <MenuItemForm
        item={item}
        items={items}
        categories={categories}
        currency={currency}
        canManage={canManage}
      />
    </PageStack>
  );
}
