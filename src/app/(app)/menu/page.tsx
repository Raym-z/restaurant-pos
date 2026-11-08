import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { MenuScreen } from "@/features/menu/components/menu-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("menu") };
}

export default function MenuPage() {
  return <MenuScreen />;
}
