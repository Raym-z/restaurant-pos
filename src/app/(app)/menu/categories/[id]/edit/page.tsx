import type { Metadata } from "next";

import { MenuCategoryEditScreen } from "@/features/menu/components/menu-category-edit-screen";

export const metadata: Metadata = {
  title: "Edit menu category",
};

export default function EditMenuCategoryPage() {
  return <MenuCategoryEditScreen />;
}
