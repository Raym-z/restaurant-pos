import { TableProperties } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("tables") };
}

export default async function TablesPage() {
  const t = await getTranslations("placeholders.modules.tables");

  return (
    <ModulePlaceholder
      title={t("title")}
      description={t("description")}
      icon={TableProperties}
      phase={t("phase")}
      planned={t.raw("planned") as string[]}
    />
  );
}
