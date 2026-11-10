import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { MenuItemEditScreen } from "@/features/menu/components/menu-item-edit-screen";
import { MenuLoadError } from "@/features/menu/components/menu-load-error";
import { getMenuViewer, loadMenuItem } from "@/features/menu/services";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("editMenuItem") };
}

export default async function EditMenuItemPage({ params }: { params: Promise<{ id: string }> }) {
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
        backHref="/menu"
        backLabel={t("backToMenu")}
        retryHref={`/menu/items/${id}/edit`}
      />
    );
  }

  const result = await loadMenuItem(viewerResult.viewer, id);
  if (!result.ok) {
    if (result.error.code === "MENU_ITEM_NOT_FOUND") {
      notFound();
    }

    return (
      <MenuLoadError
        error={result.error}
        backHref="/menu"
        backLabel={t("backToMenu")}
        retryHref={`/menu/items/${id}/edit`}
      />
    );
  }

  return (
    <MenuItemEditScreen
      item={result.data.item}
      items={result.data.items}
      categories={result.data.categories}
      currency={result.data.currency}
      canManage={result.data.canManage}
    />
  );
}
