import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { StaffDetailScreen } from "@/features/staff/components/staff-detail-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("staffMember") };
}

export default function StaffDetailPage() {
  return <StaffDetailScreen />;
}
