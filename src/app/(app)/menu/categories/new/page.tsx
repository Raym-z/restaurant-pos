import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { PageHeader, PageStack } from "@/components/layout/page";
import { MenuCategoryForm } from "@/features/menu/components/menu-category-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("newMenuCategory") };
}

export default async function NewMenuCategoryPage() {
  const t = await getTranslations("menu.categories");
  const tForm = await getTranslations("menu.categories.form");

  return (
    <PageStack>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={tForm("newTitle")}
        description={tForm("newDescription")}
        backLink={{ href: "/menu/categories", label: t("back") }}
      />
      <MenuCategoryForm />
    </PageStack>
  );
}
