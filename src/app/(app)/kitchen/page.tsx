import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader, PageStack } from "@/components/layout/page";
import { UnauthorizedState } from "@/components/states/unauthorized-state";
import { Button } from "@/components/ui/button";

import { canViewKitchen } from "@/features/kitchen/access";
import { KitchenDashboard } from "@/features/kitchen/components/kitchen-dashboard";
import { KitchenLoadError } from "@/features/kitchen/components/kitchen-load-error";
import { KITCHEN_BOARD_PAGE_SIZE } from "@/features/kitchen/contracts";
import {
  getKitchenViewer,
  loadKitchenBoard,
  loadKitchenStations,
} from "@/features/kitchen/services";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("kitchen") };
}

export default async function KitchenPage() {
  const viewerResult = await getKitchenViewer();
  if (viewerResult.status === "unauthenticated") {
    redirect("/login");
  }

  const t = await getTranslations("kitchen");

  if (viewerResult.status === "unavailable") {
    return <KitchenLoadError error={viewerResult.error} retryHref="/kitchen" />;
  }

  const { viewer } = viewerResult;
  if (!canViewKitchen(viewer.roles)) {
    return (
      <PageStack>
        <PageHeader title={t("title")} description={t("unauthorizedDescription")} />
        <UnauthorizedState
          title={t("unauthorizedTitle")}
          description={t("unauthorizedDescription")}
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard">{t("backToDashboard")}</Link>
            </Button>
          }
        />
      </PageStack>
    );
  }

  const [stationsResult, boardResult] = await Promise.all([
    loadKitchenStations(viewer.branchId),
    loadKitchenBoard({
      branchId: viewer.branchId,
      page: 1,
      limit: KITCHEN_BOARD_PAGE_SIZE,
    }),
  ]);

  if (!stationsResult.ok) {
    return <KitchenLoadError error={stationsResult.error} retryHref="/kitchen" />;
  }

  if (!boardResult.ok) {
    return <KitchenLoadError error={boardResult.error} retryHref="/kitchen" />;
  }

  return (
    <KitchenDashboard
      key={viewer.branchId}
      initialBoard={boardResult.data}
      stations={stationsResult.data.stations}
      viewer={viewer}
      initialLoadedAt={new Date().toISOString()}
    />
  );
}
