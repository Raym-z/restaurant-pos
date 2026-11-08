import { Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export default async function StaffLayout() {
  const t = await getTranslations("placeholders.unavailable.staff");

  return (
    <ModulePlaceholder
      title={t("title")}
      description={t("description")}
      icon={Users}
      phase={t("phase")}
      planned={t.raw("planned") as string[]}
    />
  );
}
