import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PosLoadError } from "@/features/pos/components/pos-load-error";
import { TablesScreen } from "@/features/pos/components/tables-screen";
import { getPosViewer, loadTableOverview } from "@/features/pos/services";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("tables") };
}

export default async function TablesPage() {
  const viewer = await getPosViewer();
  if (!viewer) {
    redirect("/login");
  }

  const result = await loadTableOverview(viewer.branchId);
  if (!result.ok) {
    const t = await getTranslations("tables");
    return (
      <PosLoadError error={result.error} backHref="/dashboard" backLabel={t("backToDashboard")} />
    );
  }

  return <TablesScreen data={result.data} viewer={viewer} />;
}
