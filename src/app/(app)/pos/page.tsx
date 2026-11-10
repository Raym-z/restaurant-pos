import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PosLoadError } from "@/features/pos/components/pos-load-error";
import { PosOrderingScreen } from "@/features/pos/components/pos-ordering-screen";
import { canOperateFloor } from "@/features/pos/access";
import {
  getPosViewer,
  loadBranchMenu,
  loadTableOverview,
  loadTableSession,
} from "@/features/pos/services";
import { tableBelongsToBranch, tableSelectionMode } from "@/features/pos/table-selection";
import type { TableSessionData } from "@/features/pos/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("pos") };
}

export default async function PosPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string | string[] }>;
}) {
  const viewerResult = await getPosViewer();
  if (viewerResult.status === "unauthenticated") {
    redirect("/login");
  }

  const t = await getTranslations("pos.ordering");
  const params = await searchParams;
  const requestedTableId = typeof params.table === "string" ? params.table : undefined;
  const retryHref = requestedTableId
    ? `/pos?table=${encodeURIComponent(requestedTableId)}`
    : "/pos";

  if (viewerResult.status === "unavailable") {
    return (
      <PosLoadError
        error={viewerResult.error}
        backHref="/dashboard"
        backLabel={t("backToDashboard")}
        retryHref="/pos"
      />
    );
  }

  const viewer = viewerResult.viewer;
  if (!canOperateFloor(viewer.roles)) {
    return (
      <PosLoadError
        error={{
          code: "PERMISSION_DENIED",
          message: "Your role does not allow Point of Sale operations.",
          retryable: false,
        }}
        backHref="/dashboard"
        backLabel={t("backToDashboard")}
      />
    );
  }

  const [tablesResult, menuResult] = await Promise.all([
    loadTableOverview(viewer.branchId),
    loadBranchMenu(viewer.branchId, viewer.currency),
  ]);

  if (!tablesResult.ok) {
    return (
      <PosLoadError
        error={tablesResult.error}
        backHref="/dashboard"
        backLabel={t("backToDashboard")}
        retryHref={retryHref}
      />
    );
  }

  if (!menuResult.ok) {
    return (
      <PosLoadError
        error={menuResult.error}
        backHref="/dashboard"
        backLabel={t("backToDashboard")}
        retryHref={retryHref}
      />
    );
  }

  let selection: TableSessionData | null = null;
  if (requestedTableId) {
    const sessionResult = await loadTableSession(requestedTableId);
    if (!sessionResult.ok) {
      return (
        <PosLoadError
          error={sessionResult.error}
          backHref="/pos"
          backLabel={t("selectTableTitle")}
          retryHref={retryHref}
        />
      );
    }

    if (!tableBelongsToBranch(sessionResult.data.table, viewer.branchId)) {
      return (
        <PosLoadError
          error={{
            code: "BRANCH_ACCESS_DENIED",
            message: "This table belongs to another branch.",
            retryable: false,
          }}
          backHref="/pos"
          backLabel={t("selectTableTitle")}
        />
      );
    }

    if (tableSelectionMode(sessionResult.data.table) === "blocked") {
      return (
        <PosLoadError
          error={{
            code: "RESOURCE_CONFLICT",
            message: "This table is inactive and cannot be used for ordering.",
            retryable: false,
          }}
          backHref="/pos"
          backLabel={t("selectTableTitle")}
        />
      );
    }

    selection = sessionResult.data;
  }

  return (
    <PosOrderingScreen
      viewer={viewer}
      tables={tablesResult.data}
      menu={menuResult.data}
      selection={selection}
    />
  );
}
