import type { Metadata } from "next";

import { MenuCategoriesScreen } from "@/features/menu/components/menu-categories-screen";

export const metadata: Metadata = {
  title: "Menu categories",
};

export default function MenuCategoriesPage() {
  return <MenuCategoriesScreen />;
}
