import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { PosLoadError } from "@/features/pos/components/pos-load-error";
import { TableDetailScreen } from "@/features/pos/components/table-detail-screen";
import { getPosViewer, loadTableDetail } from "@/features/pos/services";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("tableDetails") };
}

export default async function TableDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getPosViewer();
  if (!viewer) {
    redirect("/login");
  }

  const result = await loadTableDetail(id, viewer.currency);
  if (!result.ok) {
    if (result.error.code === "TABLE_NOT_FOUND") {
      notFound();
    }

    const t = await getTranslations("tables.detail");
    return <PosLoadError error={result.error} backHref="/tables" backLabel={t("back")} />;
  }

  return <TableDetailScreen data={result.data} viewer={viewer} />;
}
