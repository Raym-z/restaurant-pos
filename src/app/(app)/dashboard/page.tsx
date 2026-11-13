import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { DashboardLoadError } from "@/features/dashboard/components/dashboard-load-error";
import { DashboardScreen } from "@/features/dashboard/components/dashboard-screen";
import { buildDashboardRange, parseDashboardRangePreset } from "@/features/dashboard/date-range";
import { getDashboardViewer, loadDashboard } from "@/features/dashboard/services";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("dashboard") };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const viewerResult = await getDashboardViewer();
  if (viewerResult.status === "unauthenticated") {
    redirect("/login");
  }

  const params = await searchParams;
  const preset = parseDashboardRangePreset(params.range);
  const retryHref = `/dashboard?range=${preset}`;

  if (viewerResult.status === "unavailable") {
    return <DashboardLoadError error={viewerResult.error} retryHref={retryHref} />;
  }

  const viewer = viewerResult.viewer;
  const range = buildDashboardRange(preset, viewer.timezone);
  const result = await loadDashboard(viewer, range);

  if (!result.ok) {
    return <DashboardLoadError error={result.error} retryHref={retryHref} />;
  }

  return <DashboardScreen data={result.data} viewer={viewer} />;
}
