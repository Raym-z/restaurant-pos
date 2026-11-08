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
import {
  minorUnitsToPriceInput,
  parsePriceToMinorUnits,
  type ValidationErrors,
} from "@/features/shared/validation";
import type { MenuItem, MenuItemInput, MenuItemStatus } from "../types";
import { validateMenuItem } from "../validation";

interface MenuItemFormProps {
  item?: MenuItem;
}

export function MenuItemForm({ item }: MenuItemFormProps) {
  const router = useRouter();
  const { menuCategories, menuItems, branches, addMenuItem, updateMenuItem } = useMockData();
  const activeCategories = menuCategories.filter(
    (category) => category.status === "active" || category.id === item?.categoryId,
  );

  const [categoryId, setCategoryId] = useState(item?.categoryId ?? activeCategories[0]?.id ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(
    item ? minorUnitsToPriceInput(item.basePrice.amountMinor) : "",
  );
  const [status, setStatus] = useState<MenuItemStatus>(item?.status ?? "available");
  const [tags, setTags] = useState(item?.tags.join(", ") ?? "");
  const [unavailableBranchIds, setUnavailableBranchIds] = useState<string[]>(
    item
      ? item.branchAvailability.filter((entry) => !entry.isAvailable).map((entry) => entry.branchId)
      : [],
  );
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function toggleBranch(branchId: string, available: boolean) {
    setUnavailableBranchIds((current) =>
      available
        ? current.filter((id) => id !== branchId)
        : current.includes(branchId)
          ? current
          : [...current, branchId],
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);

    const parsedPrice = parsePriceToMinorUnits(price);
    const input: MenuItemInput = {
      categoryId,
      name,
      description,
      basePriceMinor: parsedPrice ?? 0,
      status,
      tags: tags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
      unavailableBranchIds,
    };
    const nextErrors = validateMenuItem(input, menuItems, item?.id);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (item) {
      updateMenuItem(item.id, input);
      router.push(`/menu/items/${item.id}`);
      return;
    }

    const created = addMenuItem(input);
    router.push(`/menu/items/${created.id}`);
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
          title="Item details"
          description="The name and description guests and staff will see on the menu."
        >
          <FormGrid>
            <FormField label="Category" htmlFor="item-category" required error={errors.categoryId}>
              <Select
                id="item-category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                aria-invalid={Boolean(errors.categoryId)}
              >
                <option value="">Choose a category</option>
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Item name" htmlFor="item-name" required error={errors.name}>
              <Input
                id="item-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={Boolean(errors.name)}
                placeholder="Lamb Kofta Plate"
              />
            </FormField>
            <FormField
              label="Description"
              htmlFor="item-description"
              error={errors.description}
              description="Up to 400 characters."
              className="sm:col-span-2"
            >
              <Textarea
                id="item-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                aria-invalid={Boolean(errors.description)}
                rows={3}
                placeholder="Charred lamb kofta, green tahini, sumac onions, and grilled pita."
              />
            </FormField>
            <FormField
              label="Base price"
              htmlFor="item-price"
              required
              error={errors.basePriceMinor}
              description="Enter the price in major units, for example 28.00."
            >
              <Input
                id="item-price"
                inputMode="decimal"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                aria-invalid={Boolean(errors.basePriceMinor)}
                placeholder="28.00"
              />
            </FormField>
            <FormField label="Status" htmlFor="item-status" required>
              <Select
                id="item-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as MenuItemStatus)}
              >
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="archived">Archived</option>
              </Select>
            </FormField>
            <FormField
              label="Tags"
              htmlFor="item-tags"
              error={errors.tags}
              description="Comma-separated, for example vegetarian, gluten-free."
              className="sm:col-span-2"
            >
              <Input
                id="item-tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                aria-invalid={Boolean(errors.tags)}
                placeholder="vegetarian, signature"
              />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection
          title="Branch availability"
          description="Unchecked branches will not offer this item. The organization-level status still applies."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {branches.map((branch) => {
              const available = !unavailableBranchIds.includes(branch.id);
              return (
                <label
                  key={branch.id}
                  className="flex items-center justify-between rounded-lg border border-line bg-surface-subtle px-3 py-2.5 text-sm"
                >
                  <span>
                    <span className="font-medium text-ink">{branch.name}</span>
                    <span className="ml-1 text-xs text-ink-subtle">{branch.code}</span>
                  </span>
                  <span className="flex items-center gap-2 text-xs text-ink-muted">
                    Available
                    <input
                      type="checkbox"
                      checked={available}
                      onChange={(event) => toggleBranch(branch.id, event.target.checked)}
                      className="size-4 rounded border-line-strong accent-brand"
                    />
                  </span>
                </label>
              );
            })}
          </div>
          {item && (item.variants.length > 0 || item.modifierGroups.length > 0) ? (
            <p className="rounded-lg bg-surface-subtle p-3 text-[13px] leading-5 text-ink-muted">
              This item has {item.variants.length} variant
              {item.variants.length === 1 ? "" : "s"} and {item.modifierGroups.length} modifier
              group
              {item.modifierGroups.length === 1 ? "" : "s"}. They are shown on the item detail page
              and are preserved when saving profile changes.
            </p>
          ) : null}
        </FormSection>

        <FormActions>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(item ? `/menu/items/${item.id}` : "/menu")}
          >
            Cancel
          </Button>
          <Button type="submit">{item ? "Save changes" : "Create item"}</Button>
        </FormActions>
      </Card>
    </form>
  );
}
