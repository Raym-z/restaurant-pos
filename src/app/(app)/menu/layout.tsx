import { UtensilsCrossed } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export default async function MenuLayout() {
  const t = await getTranslations("placeholders.unavailable.menu");

  return (
    <ModulePlaceholder
      title={t("title")}
      description={t("description")}
      icon={UtensilsCrossed}
      phase={t("phase")}
      planned={t.raw("planned") as string[]}
    />
  );
}
