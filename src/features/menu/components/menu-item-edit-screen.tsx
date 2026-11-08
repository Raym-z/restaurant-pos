"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";

import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { useMockData } from "@/features/shared/mock-data-provider";
import { MenuItemForm } from "./menu-item-form";

export function MenuItemEditScreen() {
  const params = useParams<{ id: string }>();
  const { menuItems } = useMockData();
  const item = menuItems.find((entry) => entry.id === params.id);

  if (!item) {
    return (
      <PageStack>
        <PageHeader
          title="Menu item not found"
          backLink={{ href: "/menu", label: "Back to menu" }}
        />
        <EmptyState
          icon={UtensilsCrossed}
          title="This menu item could not be found"
          description="It may have been removed, or the link is no longer valid."
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/menu">Back to menu</Link>
            </Button>
          }
        />
      </PageStack>
    );
  }

  return (
    <PageStack>
      <PageHeader
        eyebrow="Menu item"
        title={`Edit ${item.name}`}
        description="Update pricing, availability, tags, and the item profile."
        backLink={{ href: `/menu/items/${item.id}`, label: "Back to item" }}
      />
      <MenuItemForm item={item} />
    </PageStack>
  );
}
