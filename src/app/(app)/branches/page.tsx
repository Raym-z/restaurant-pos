import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { BranchesScreen } from "@/features/branches/components/branches-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("branches") };
}

export default function BranchesPage() {
  return <BranchesScreen />;
}
