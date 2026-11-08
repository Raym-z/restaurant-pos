import { Receipt } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("orders") };
}

export default async function OrdersPage() {
  const t = await getTranslations("placeholders.modules.orders");

  return (
    <ModulePlaceholder
      title={t("title")}
      description={t("description")}
      icon={Receipt}
      phase={t("phase")}
      planned={t.raw("planned") as string[]}
    />
  );
}
