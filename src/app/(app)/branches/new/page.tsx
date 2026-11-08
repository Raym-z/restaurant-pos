import { Store } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("newBranch") };
}

export default async function NewBranchPage() {
  const t = await getTranslations("placeholders.unavailable.branchCreate");

  return (
    <ModulePlaceholder
      title={t("title")}
      description={t("description")}
      icon={Store}
      phase={t("phase")}
      planned={t.raw("planned") as string[]}
      backHref="/branches"
      backLabel={t("back")}
    />
  );
}
