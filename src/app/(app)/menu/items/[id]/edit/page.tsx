import type { Metadata } from "next";

import { MenuItemEditScreen } from "@/features/menu/components/menu-item-edit-screen";

export const metadata: Metadata = {
  title: "Edit menu item",
};

export default function EditMenuItemPage() {
  return <MenuItemEditScreen />;
}
