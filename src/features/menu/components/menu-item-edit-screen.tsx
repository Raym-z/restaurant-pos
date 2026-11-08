"use client";

import { UtensilsCrossed } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";

import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { useMockData } from "@/features/shared/mock-data-provider";
import { localizeMenuItem } from "../selectors";
import { MenuItemForm } from "./menu-item-form";

export function MenuItemEditScreen() {
  const params = useParams<{ id: string }>();
  const locale = useLocale();
  const { menuItems } = useMockData();
  const t = useTranslations("menu.item");
  const tForm = useTranslations("menu.form");
  const item = menuItems.find((entry) => entry.id === params.id);

  if (!item) {
    return (
      <PageStack>
        <PageHeader title={t("notFoundTitle")} backLink={{ href: "/menu", label: t("back") }} />
        <EmptyState
          icon={UtensilsCrossed}
          title={t("notFoundTitle")}
          description={t("notFoundDescription")}
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/menu">{t("backToMenu")}</Link>
            </Button>
          }
        />
      </PageStack>
    );
  }

  return (
    <PageStack>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={tForm("editTitle", {
          name: localizeMenuItem(item, locale).name,
        })}
        description={tForm("editDescription")}
        backLink={{ href: `/menu/items/${item.id}`, label: t("back") }}
      />
      <MenuItemForm item={item} />
    </PageStack>
  );
}
