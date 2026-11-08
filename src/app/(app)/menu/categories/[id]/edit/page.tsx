import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { MenuCategoryEditScreen } from "@/features/menu/components/menu-category-edit-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("editMenuCategory") };
}

export default function EditMenuCategoryPage() {
  return <MenuCategoryEditScreen />;
}
