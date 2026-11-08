import { Settings } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("settings") };
}

export default async function SettingsPage() {
  const t = await getTranslations("placeholders.modules.settings");

  return (
    <ModulePlaceholder
      title={t("title")}
      description={t("description")}
      icon={Settings}
      phase={t("phase")}
      planned={t.raw("planned") as string[]}
    />
  );
}
