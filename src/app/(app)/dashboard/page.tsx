import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { DashboardScreen } from "@/features/dashboard/components/dashboard-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("dashboard") };
}

export default function DashboardPage() {
  return <DashboardScreen />;
}
