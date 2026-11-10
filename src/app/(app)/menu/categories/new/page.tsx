import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MenuCategoryForm } from "@/features/menu/components/menu-category-form";
import { MenuLoadError } from "@/features/menu/components/menu-load-error";
import { PageHeader, PageStack } from "@/components/layout/page";
import { getMenuViewer, loadMenuOverview } from "@/features/menu/services";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("newMenuCategory") };
}

export default async function NewMenuCategoryPage() {
  const viewerResult = await getMenuViewer();
  if (viewerResult.status === "unauthenticated") {
    redirect("/login");
  }

  const t = await getTranslations("menuAdmin");

  if (viewerResult.status === "unavailable") {
    return (
      <MenuLoadError
        error={viewerResult.error}
        backHref="/menu/categories"
        backLabel={t("categories.back")}
        retryHref="/menu/categories/new"
      />
    );
  }

  const result = await loadMenuOverview(viewerResult.viewer);
  if (!result.ok) {
    return (
      <MenuLoadError
        error={result.error}
        backHref="/menu/categories"
        backLabel={t("categories.back")}
        retryHref="/menu/categories/new"
      />
    );
  }

  return (
    <PageStack>
      <PageHeader
        title={t("form.newCategoryTitle")}
        description={t("form.newCategoryDescription")}
        backLink={{ href: "/menu/categories", label: t("categories.back") }}
      />
      <MenuCategoryForm categories={result.data.categories} canManage={result.data.canManage} />
    </PageStack>
  );
}
