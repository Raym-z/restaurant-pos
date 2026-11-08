import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { MenuItemEditScreen } from "@/features/menu/components/menu-item-edit-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("editMenuItem") };
}

export default function EditMenuItemPage() {
  return <MenuItemEditScreen />;
}
