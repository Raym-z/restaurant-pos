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
  const viewerResult = await getPosViewer();
  if (viewerResult.status === "unauthenticated") {
    redirect("/login");
  }

  const t = await getTranslations("tables");
  if (viewerResult.status === "unavailable") {
    return (
      <PosLoadError
        error={viewerResult.error}
        backHref="/dashboard"
        backLabel={t("backToDashboard")}
        retryHref="/tables"
      />
    );
  }

  const result = await loadTableOverview(viewerResult.viewer.branchId, {
    includeInactive: true,
  });
  if (!result.ok) {
    return (
      <PosLoadError
        error={result.error}
        backHref="/dashboard"
        backLabel={t("backToDashboard")}
        retryHref="/tables"
      />
    );
  }

  return <TablesScreen data={result.data} viewer={viewerResult.viewer} />;
}
