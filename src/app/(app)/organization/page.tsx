import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { OrganizationScreen } from "@/features/organization/components/organization-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("organization") };
}

export default function OrganizationPage() {
  return <OrganizationScreen />;
}
