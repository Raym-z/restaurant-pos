import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MenuCategoriesScreen } from "@/features/menu/components/menu-categories-screen";
import { MenuLoadError } from "@/features/menu/components/menu-load-error";
import { getMenuViewer, loadMenuOverview } from "@/features/menu/services";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("menuCategories") };
}

export default async function MenuCategoriesPage() {
  const viewerResult = await getMenuViewer();
  if (viewerResult.status === "unauthenticated") {
    redirect("/login");
  }

  const t = await getTranslations("menuAdmin");

  if (viewerResult.status === "unavailable") {
    return (
      <MenuLoadError
        error={viewerResult.error}
        backHref="/menu"
        backLabel={t("backToMenu")}
        retryHref="/menu/categories"
      />
    );
  }

  const result = await loadMenuOverview(viewerResult.viewer);
  if (!result.ok) {
    return (
      <MenuLoadError
        error={result.error}
        backHref="/menu"
        backLabel={t("backToMenu")}
        retryHref="/menu/categories"
      />
    );
  }

  return <MenuCategoriesScreen data={result.data} />;
}
