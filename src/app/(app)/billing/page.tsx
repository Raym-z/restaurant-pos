import { CreditCard } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("billing") };
}

export default async function BillingPage() {
  const t = await getTranslations("placeholders.modules.billing");

  return (
    <ModulePlaceholder
      title={t("title")}
      description={t("description")}
      icon={CreditCard}
      phase={t("phase")}
      planned={t.raw("planned") as string[]}
    />
  );
}
