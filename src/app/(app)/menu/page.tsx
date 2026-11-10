import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MenuLoadError } from "@/features/menu/components/menu-load-error";
import { MenuScreen } from "@/features/menu/components/menu-screen";
import { getMenuViewer, loadMenuOverview } from "@/features/menu/services";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("menu") };
}

export default async function MenuPage() {
  const viewerResult = await getMenuViewer();
  if (viewerResult.status === "unauthenticated") {
    redirect("/login");
  }

  const t = await getTranslations("menuAdmin");

  if (viewerResult.status === "unavailable") {
    return (
      <MenuLoadError
        error={viewerResult.error}
        backHref="/dashboard"
        backLabel={t("backToDashboard")}
        retryHref="/menu"
      />
    );
  }

  const result = await loadMenuOverview(viewerResult.viewer);
  if (!result.ok) {
    return (
      <MenuLoadError
        error={result.error}
        backHref="/dashboard"
        backLabel={t("backToDashboard")}
        retryHref="/menu"
      />
    );
  }

  return <MenuScreen data={result.data} />;
}
