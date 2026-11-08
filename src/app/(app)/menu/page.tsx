import type { Metadata } from "next";

import { MenuScreen } from "@/features/menu/components/menu-screen";

export const metadata: Metadata = {
  title: "Menu",
};

export default function MenuPage() {
  return <MenuScreen />;
}
