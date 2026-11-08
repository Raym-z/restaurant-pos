import { BarChart3 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("reports") };
}

export default async function ReportsPage() {
  const t = await getTranslations("placeholders.modules.reports");

  return (
    <ModulePlaceholder
      title={t("title")}
      description={t("description")}
      icon={BarChart3}
      phase={t("phase")}
      planned={t.raw("planned") as string[]}
    />
  );
}
