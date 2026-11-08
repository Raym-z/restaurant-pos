import type { Metadata } from "next";

import { PageHeader, PageStack } from "@/components/layout/page";
import { MenuItemForm } from "@/features/menu/components/menu-item-form";

export const metadata: Metadata = {
  title: "New menu item",
};

export default function NewMenuItemPage() {
  return (
    <PageStack>
      <PageHeader
        eyebrow="Menu"
        title="New menu item"
        description="Add an item to a category with pricing and branch availability."
        backLink={{ href: "/menu", label: "Back to menu" }}
      />
      <MenuItemForm />
    </PageStack>
  );
}
