import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { MenuCategoriesScreen } from "@/features/menu/components/menu-categories-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("menuCategories") };
}

export default function MenuCategoriesPage() {
  return <MenuCategoriesScreen />;
}
