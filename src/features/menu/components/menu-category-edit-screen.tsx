"use client";

import { useTranslations } from "next-intl";

import { PageHeader, PageStack } from "@/components/layout/page";

import type { MenuCategoryView } from "../models";
import { MenuCategoryForm } from "./menu-category-form";

export function MenuCategoryEditScreen({
  category,
  categories,
  canManage,
}: {
  category: MenuCategoryView;
  categories: MenuCategoryView[];
  canManage: boolean;
}) {
  const t = useTranslations("menuAdmin");

  return (
    <PageStack>
      <PageHeader
        title={t("form.editCategoryTitle", { name: category.name })}
        description={t("form.editCategoryDescription")}
        backLink={{ href: "/menu/categories", label: t("categories.back") }}
      />
      <MenuCategoryForm category={category} categories={categories} canManage={canManage} />
    </PageStack>
  );
}
