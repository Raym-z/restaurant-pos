import type { Metadata } from "next";

import { PageHeader, PageStack } from "@/components/layout/page";
import { MenuCategoryForm } from "@/features/menu/components/menu-category-form";

export const metadata: Metadata = {
  title: "New menu category",
};

export default function NewMenuCategoryPage() {
  return (
    <PageStack>
      <PageHeader
        eyebrow="Menu"
        title="New category"
        description="Create a category to group menu items."
        backLink={{ href: "/menu/categories", label: "Back to categories" }}
      />
      <MenuCategoryForm />
    </PageStack>
  );
}
