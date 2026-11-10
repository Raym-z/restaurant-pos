import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { MenuCategoryEditScreen } from "@/features/menu/components/menu-category-edit-screen";
import { MenuLoadError } from "@/features/menu/components/menu-load-error";
import { getMenuViewer, loadMenuCategory } from "@/features/menu/services";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("editMenuCategory") };
}

export default async function EditMenuCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
        retryHref={`/menu/categories/${id}/edit`}
      />
    );
  }

  const result = await loadMenuCategory(viewerResult.viewer, id);
  if (!result.ok) {
    if (result.error.code === "MENU_ITEM_NOT_FOUND") {
      notFound();
    }

    return (
      <MenuLoadError
        error={result.error}
        backHref="/menu/categories"
        backLabel={t("categories.back")}
        retryHref={`/menu/categories/${id}/edit`}
      />
    );
  }

  return (
    <MenuCategoryEditScreen
      category={result.data.category}
      categories={result.data.categories}
      canManage={result.data.canManage}
    />
  );
}
