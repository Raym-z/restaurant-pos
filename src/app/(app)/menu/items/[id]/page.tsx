import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { MenuItemDetailScreen } from "@/features/menu/components/menu-item-detail-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("menuItem") };
}

export default function MenuItemDetailPage() {
  return <MenuItemDetailScreen />;
}
