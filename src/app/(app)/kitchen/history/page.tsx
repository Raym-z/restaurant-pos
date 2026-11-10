import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader, PageStack } from "@/components/layout/page";
import { UnauthorizedState } from "@/components/states/unauthorized-state";
import { Button } from "@/components/ui/button";

import { canManageKitchenStations, canViewKitchen } from "@/features/kitchen/access";
import { KitchenHistoryScreen } from "@/features/kitchen/components/kitchen-history-screen";
import { KitchenLoadError } from "@/features/kitchen/components/kitchen-load-error";
import {
  KITCHEN_HISTORY_PAGE_SIZE,
  defaultKitchenHistoryRange,
  parseKitchenHistoryFilters,
} from "@/features/kitchen/history-filters";
import {
  getKitchenViewer,
  loadKitchenHistory,
  loadKitchenStations,
} from "@/features/kitchen/services";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("kitchen.history");
  return { title: t("title") };
}

export default async function KitchenHistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewerResult = await getKitchenViewer();
  if (viewerResult.status === "unauthenticated") {
    redirect("/login");
  }

  const t = await getTranslations("kitchen");

  if (viewerResult.status === "unavailable") {
    return <KitchenLoadError error={viewerResult.error} retryHref="/kitchen/history" />;
  }

  const { viewer } = viewerResult;
  if (!canViewKitchen(viewer.roles)) {
    return (
      <PageStack>
        <PageHeader title={t("history.title")} description={t("unauthorizedDescription")} />
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

  const params = await searchParams;
  const now = new Date();
  const defaults = defaultKitchenHistoryRange(now, viewer.timezone);
  const parsedFilters = parseKitchenHistoryFilters(params, viewer.timezone, now);
  const stationsResult = await loadKitchenStations(viewer.branchId);
  const stations = stationsResult.ok ? stationsResult.data.stations : [];

  if (!parsedFilters.ok) {
    return (
      <KitchenHistoryScreen
        viewer={viewer}
        filters={null}
        defaults={defaults}
        filterError={parsedFilters.error}
        board={null}
        loadError={null}
        stations={stations}
        canManageStations={canManageKitchenStations(viewer.roles)}
      />
    );
  }

  const boardResult = await loadKitchenHistory({
    branchId: viewer.branchId,
    stationId: parsedFilters.filters.stationId,
    statuses: parsedFilters.filters.statuses,
    page: parsedFilters.filters.page,
    limit: KITCHEN_HISTORY_PAGE_SIZE,
    from: parsedFilters.filters.fromInstant,
    to: parsedFilters.filters.toInstant,
  });

  return (
    <KitchenHistoryScreen
      viewer={viewer}
      filters={parsedFilters.filters}
      defaults={defaults}
      filterError={null}
      board={boardResult.ok ? boardResult.data : null}
      loadError={boardResult.ok ? null : boardResult.error}
      stations={stations}
      canManageStations={canManageKitchenStations(viewer.roles)}
    />
  );
}
