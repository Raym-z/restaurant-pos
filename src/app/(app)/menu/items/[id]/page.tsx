import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { MenuItemDetailScreen } from "@/features/menu/components/menu-item-detail-screen";
import { MenuLoadError } from "@/features/menu/components/menu-load-error";
import { getMenuViewer, loadMenuItem } from "@/features/menu/services";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("menuItem") };
}

export default async function MenuItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
        retryHref={`/menu/items/${id}`}
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
        retryHref={`/menu/items/${id}`}
      />
    );
  }

  return (
    <MenuItemDetailScreen
      item={result.data.item}
      timezone={result.data.timezone}
      canManage={result.data.canManage}
    />
  );
}
