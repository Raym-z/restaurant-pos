import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { BranchDetailScreen } from "@/features/branches/components/branch-detail-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("branchDetails") };
}

export default function BranchDetailPage() {
  return <BranchDetailScreen />;
}
