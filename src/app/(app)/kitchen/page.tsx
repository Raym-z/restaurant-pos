import { ChefHat } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("kitchen") };
}

export default async function KitchenPage() {
  const t = await getTranslations("placeholders.modules.kitchen");

  return (
    <ModulePlaceholder
      title={t("title")}
      description={t("description")}
      icon={ChefHat}
      phase={t("phase")}
      planned={t.raw("planned") as string[]}
    />
  );
}
