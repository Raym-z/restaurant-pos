import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { StaffScreen } from "@/features/staff/components/staff-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("staff") };
}

export default function StaffPage() {
  return <StaffScreen />;
}
