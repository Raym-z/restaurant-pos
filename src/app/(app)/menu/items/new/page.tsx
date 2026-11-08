import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { PageHeader, PageStack } from "@/components/layout/page";
import { MenuItemForm } from "@/features/menu/components/menu-item-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("newMenuItem") };
}

export default async function NewMenuItemPage() {
  const t = await getTranslations("menu.form");
  const tItem = await getTranslations("menu.item");

  return (
    <PageStack>
      <PageHeader
        eyebrow={tItem("eyebrow")}
        title={t("newTitle")}
        description={t("newDescription")}
        backLink={{ href: "/menu", label: tItem("back") }}
      />
      <MenuItemForm />
    </PageStack>
  );
}
