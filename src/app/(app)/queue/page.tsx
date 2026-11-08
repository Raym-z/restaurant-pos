import { ListOrdered } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("queue") };
}

export default async function QueuePage() {
  const t = await getTranslations("placeholders.modules.queue");

  return (
    <ModulePlaceholder
      title={t("title")}
      description={t("description")}
      icon={ListOrdered}
      phase={t("phase")}
      planned={t.raw("planned") as string[]}
    />
  );
}
