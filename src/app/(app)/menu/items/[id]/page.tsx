import type { Metadata } from "next";

import { MenuItemDetailScreen } from "@/features/menu/components/menu-item-detail-screen";

export const metadata: Metadata = {
  title: "Menu item",
};

export default function MenuItemDetailPage() {
  return <MenuItemDetailScreen />;
}
