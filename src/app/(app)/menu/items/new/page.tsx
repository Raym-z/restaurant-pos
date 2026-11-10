import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader, PageStack } from "@/components/layout/page";
import { MenuItemForm } from "@/features/menu/components/menu-item-form";
import { MenuLoadError } from "@/features/menu/components/menu-load-error";
import { getMenuViewer, loadMenuOverview } from "@/features/menu/services";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("newMenuItem") };
}

export default async function NewMenuItemPage() {
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
        retryHref="/menu/items/new"
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
        retryHref="/menu/items/new"
      />
    );
  }

  return (
    <PageStack>
      <PageHeader
        title={t("form.newItemTitle")}
        description={t("form.newItemDescription")}
        backLink={{ href: "/menu", label: t("backToMenu") }}
      />
      <MenuItemForm
        items={result.data.items}
        categories={result.data.categories}
        currency={result.data.currency}
        canManage={result.data.canManage}
      />
    </PageStack>
  );
}
