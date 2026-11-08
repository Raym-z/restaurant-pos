import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { BranchEditScreen } from "@/features/branches/components/branch-edit-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("editBranch") };
}

export default function EditBranchPage() {
  return <BranchEditScreen />;
}
