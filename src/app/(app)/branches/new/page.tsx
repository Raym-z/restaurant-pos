import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { PageHeader, PageStack } from "@/components/layout/page";
import { BranchForm } from "@/features/branches/components/branch-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("newBranch") };
}

export default async function NewBranchPage() {
  const t = await getTranslations("branches.form");
  const tDetail = await getTranslations("branches.detail");

  return (
    <PageStack>
      <PageHeader
        eyebrow={tDetail("eyebrow")}
        title={t("newTitle")}
        description={t("newDescription")}
        backLink={{ href: "/branches", label: tDetail("back") }}
      />
      <BranchForm />
    </PageStack>
  );
}
