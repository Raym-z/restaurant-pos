"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Tags } from "lucide-react";

import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { useMockData } from "@/features/shared/mock-data-provider";
import { MenuCategoryForm } from "./menu-category-form";

export function MenuCategoryEditScreen() {
  const params = useParams<{ id: string }>();
  const { menuCategories } = useMockData();
  const category = menuCategories.find((entry) => entry.id === params.id);

  if (!category) {
    return (
      <PageStack>
        <PageHeader
          title="Category not found"
          backLink={{ href: "/menu/categories", label: "Back to categories" }}
        />
        <EmptyState
          icon={Tags}
          title="This category could not be found"
          description="It may have been removed, or the link is no longer valid."
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/menu/categories">Back to categories</Link>
            </Button>
          }
        />
      </PageStack>
    );
  }

  return (
    <PageStack>
      <PageHeader
        eyebrow="Menu category"
        title={`Edit ${category.name}`}
        description="Update how this category appears in the menu."
        backLink={{ href: "/menu/categories", label: "Back to categories" }}
      />
      <MenuCategoryForm category={category} />
    </PageStack>
  );
}
