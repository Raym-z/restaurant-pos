import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader, PageStack } from "@/components/layout/page";
import { UnauthorizedState } from "@/components/states/unauthorized-state";
import { Button } from "@/components/ui/button";

import { canManageKitchenStations, canViewKitchen } from "@/features/kitchen/access";
import { KitchenLoadError } from "@/features/kitchen/components/kitchen-load-error";
import { StationManagementScreen } from "@/features/kitchen/components/station-management-screen";
import { getKitchenViewer, loadKitchenStationPage } from "@/features/kitchen/services";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("kitchen.stations");
  return { title: t("title") };
}

export default async function KitchenStationsPage() {
  const viewerResult = await getKitchenViewer();
  if (viewerResult.status === "unauthenticated") {
    redirect("/login");
  }

  const t = await getTranslations("kitchen");

  if (viewerResult.status === "unavailable") {
    return <KitchenLoadError error={viewerResult.error} retryHref="/kitchen/stations" />;
  }

  const { viewer } = viewerResult;
  if (!canViewKitchen(viewer.roles) || !canManageKitchenStations(viewer.roles)) {
    return (
      <PageStack>
        <PageHeader
          title={t("stations.title")}
          description={t("stations.unauthorizedDescription")}
        />
        <UnauthorizedState
          title={t("unauthorizedTitle")}
          description={t("stations.unauthorizedDescription")}
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/kitchen">{t("stations.backToBoard")}</Link>
            </Button>
          }
        />
      </PageStack>
    );
  }

  const result = await loadKitchenStationPage(viewer.branchId);
  if (!result.ok) {
    return <KitchenLoadError error={result.error} retryHref="/kitchen/stations" />;
  }

  return (
    <StationManagementScreen
      key={viewer.branchId}
      branchId={result.data.branchId}
      branchName={viewer.branchName}
      initialStations={result.data.stations}
      catalog={result.data.catalog}
      roles={viewer.roles}
    />
  );
}
