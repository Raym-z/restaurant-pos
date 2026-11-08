"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { FormActions, FormField, FormGrid, FormSection } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMockData } from "@/features/shared/mock-data-provider";
import type { ValidationErrors } from "@/features/shared/validation";
import type { MenuCategory, MenuCategoryInput, MenuCategoryStatus } from "../types";
import { validateMenuCategory } from "../validation";

interface MenuCategoryFormProps {
  category?: MenuCategory;
}

export function MenuCategoryForm({ category }: MenuCategoryFormProps) {
  const router = useRouter();
  const { menuCategories, addMenuCategory, updateMenuCategory } = useMockData();
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [status, setStatus] = useState<MenuCategoryStatus>(category?.status ?? "active");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const input: MenuCategoryInput = { name, description, status };
    const nextErrors = validateMenuCategory(input, menuCategories, category?.id);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    if (category) {
      updateMenuCategory(category.id, input);
    } else {
      addMenuCategory(input);
    }
    router.push("/menu/categories");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {submitted && Object.keys(errors).length > 0 ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft/50 px-4 py-3 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>Review the highlighted fields before saving.</p>
        </div>
      ) : null}

      <Card className="space-y-6 p-5 sm:p-6">
        <FormSection
          title="Category details"
          description="Categories group menu items for staff and guest-facing menus."
        >
          <FormGrid>
            <FormField label="Category name" htmlFor="category-name" required error={errors.name}>
              <Input
                id="category-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={Boolean(errors.name)}
                placeholder="Wood-Fired Mains"
              />
            </FormField>
            <FormField label="Status" htmlFor="category-status" required>
              <Select
                id="category-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as MenuCategoryStatus)}
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </Select>
            </FormField>
            <FormField
              label="Description"
              htmlFor="category-description"
              error={errors.description}
              description="Up to 240 characters."
              className="sm:col-span-2"
            >
              <Textarea
                id="category-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                aria-invalid={Boolean(errors.description)}
                rows={3}
                placeholder="Plates finished over oak and olive wood."
              />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormActions>
          <Button type="button" variant="secondary" onClick={() => router.push("/menu/categories")}>
            Cancel
          </Button>
          <Button type="submit">{category ? "Save category" : "Create category"}</Button>
        </FormActions>
      </Card>
    </form>
  );
}
