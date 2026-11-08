"use client";

import { Tags } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";

import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { useMockData } from "@/features/shared/mock-data-provider";
import { localizeMenuCategory } from "../selectors";
import { MenuCategoryForm } from "./menu-category-form";

export function MenuCategoryEditScreen() {
  const params = useParams<{ id: string }>();
  const locale = useLocale();
  const { menuCategories } = useMockData();
  const t = useTranslations("menu.categories");
  const tForm = useTranslations("menu.categories.form");
  const category = menuCategories.find((entry) => entry.id === params.id);

  if (!category) {
    return (
      <PageStack>
        <PageHeader
          title={t("notFoundTitle")}
          backLink={{ href: "/menu/categories", label: t("back") }}
        />
        <EmptyState
          icon={Tags}
          title={t("notFoundTitle")}
          description={t("notFoundDescription")}
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/menu/categories">{t("back")}</Link>
            </Button>
          }
        />
      </PageStack>
    );
  }

  return (
    <PageStack>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={tForm("editTitle", {
          name: localizeMenuCategory(category, locale).name,
        })}
        description={tForm("editDescription")}
        backLink={{ href: "/menu/categories", label: t("back") }}
      />
      <MenuCategoryForm category={category} />
    </PageStack>
  );
}
