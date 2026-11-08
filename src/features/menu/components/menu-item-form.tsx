"use client";

import { AlertCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormActions, FormField, FormGrid, FormSection } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMockData } from "@/features/shared/mock-data-provider";
import { useWorkspace } from "@/providers/workspace-provider";
import type { ValidationErrors } from "@/features/shared/validation";
import { formatMoneyInput, parseMoneyInput } from "@/lib/currency";
import { useStatusLabel } from "@/i18n/use-labels";
import { toggleUnavailableBranch, unavailableBranchIdsForItem } from "../availability";
import { createMenuItemContentDraft, resolveContentLocale } from "../content";
import type { MenuContentLocale, MenuItem, MenuItemInput, MenuItemStatus } from "../types";
import { localizeMenuCategory } from "../selectors";
import { validateMenuItem } from "../validation";

interface MenuItemFormProps {
  item?: MenuItem;
}

export function MenuItemForm({ item }: MenuItemFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const { menuCategories, menuItems, addMenuItem, updateMenuItem } = useMockData();
  const { branches, organization } = useWorkspace();
  const t = useTranslations("menu.form");
  const tCommon = useTranslations("common");
  const tContentEditing = useTranslations("menu.contentEditing");
  const tLanguages = useTranslations("languages");
  const tValidation = useTranslations("validation");
  const statusLabel = useStatusLabel();
  const activeCategories = menuCategories.filter(
    (category) => category.status === "active" || category.id === item?.categoryId,
  );

  // Capture the content-editing locale once. Changing the interface language
  // after mount must never retarget the draft to another translation.
  const [editingLocale] = useState<MenuContentLocale>(() => resolveContentLocale(locale));
  const itemContent = item ? createMenuItemContentDraft(item, editingLocale) : null;
  const interfaceLocale = resolveContentLocale(locale);
  const contentLocaleMismatch = interfaceLocale !== editingLocale;

  const [categoryId, setCategoryId] = useState(item?.categoryId ?? activeCategories[0]?.id ?? "");
  const [name, setName] = useState(itemContent?.name ?? "");
  const [description, setDescription] = useState(itemContent?.description ?? "");
  const [price, setPrice] = useState(
    item ? formatMoneyInput(item.basePrice.amountMinor, item.basePrice.currency) : "",
  );
  const [status, setStatus] = useState<MenuItemStatus>(item?.status ?? "available");
  const [tags, setTags] = useState(item?.tags.join(", ") ?? "");
  const [unavailableBranchIds, setUnavailableBranchIds] = useState<string[]>(
    item ? unavailableBranchIdsForItem(item) : [],
  );
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function toggleBranch(branchId: string, available: boolean) {
    setUnavailableBranchIds((current) => toggleUnavailableBranch(current, branchId, available));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);

    const parsedPrice = parseMoneyInput(price, organization.currency);
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
      contentLocale: editingLocale,
    };
    const nextErrors = validateMenuItem(
      input,
      menuItems,
      item?.id,
      tValidation,
      organization.currency,
    );
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
      <p
        role={contentLocaleMismatch ? "alert" : "status"}
        className={
          contentLocaleMismatch
            ? "rounded-lg border border-warning/25 bg-warning-soft/60 px-4 py-3 text-sm text-ink"
            : "rounded-lg border border-line bg-surface-subtle px-4 py-3 text-sm text-ink-muted"
        }
      >
        {contentLocaleMismatch
          ? tContentEditing("mismatch", {
              language: tLanguages(editingLocale),
            })
          : tContentEditing("notice", {
              language: tLanguages(editingLocale),
            })}
      </p>

      {submitted && Object.keys(errors).length > 0 ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft/50 px-4 py-3 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{tCommon("reviewFields")}</p>
        </div>
      ) : null}

      <Card className="space-y-6 p-5 sm:p-6">
        <FormSection title={t("sections.details")} description={t("sections.detailsDescription")}>
          <FormGrid>
            <FormField
              label={t("fields.category")}
              htmlFor="item-category"
              required
              error={errors.categoryId}
            >
              <Select
                id="item-category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                aria-invalid={Boolean(errors.categoryId)}
                aria-describedby={errors.categoryId ? "item-category-error" : undefined}
              >
                <option value="">{t("placeholders.category")}</option>
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {localizeMenuCategory(category, locale).name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t("fields.name")} htmlFor="item-name" required error={errors.name}>
              <Input
                id="item-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "item-name-error" : undefined}
                placeholder={t("placeholders.name")}
              />
            </FormField>
            <FormField
              label={t("fields.description")}
              htmlFor="item-description"
              error={errors.description}
              description={t("hints.description")}
              className="sm:col-span-2"
            >
              <Textarea
                id="item-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={
                  errors.description ? "item-description-error" : "item-description-description"
                }
                rows={3}
                placeholder={t("placeholders.description")}
              />
            </FormField>
            <FormField
              label={t("fields.basePrice")}
              htmlFor="item-price"
              required
              error={errors.basePriceMinor}
              description={t("hints.price")}
            >
              <Input
                id="item-price"
                inputMode="numeric"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                aria-invalid={Boolean(errors.basePriceMinor)}
                aria-describedby={
                  errors.basePriceMinor ? "item-price-error" : "item-price-description"
                }
                placeholder={t("placeholders.price")}
              />
            </FormField>
            <FormField label={t("fields.status")} htmlFor="item-status" required>
              <Select
                id="item-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as MenuItemStatus)}
              >
                <option value="available">{statusLabel("available")}</option>
                <option value="unavailable">{statusLabel("unavailable")}</option>
                <option value="archived">{statusLabel("archived")}</option>
              </Select>
            </FormField>
            <FormField
              label={t("fields.tags")}
              htmlFor="item-tags"
              error={errors.tags}
              description={t("hints.tags")}
              className="sm:col-span-2"
            >
              <Input
                id="item-tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                aria-invalid={Boolean(errors.tags)}
                aria-describedby={errors.tags ? "item-tags-error" : "item-tags-description"}
                placeholder={t("placeholders.tags")}
              />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection
          title={t("sections.availability")}
          description={t("sections.availabilityDescription")}
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
                    <span className="ml-1 text-xs text-ink-subtle">{branch.timezone}</span>
                  </span>
                  <span className="flex items-center gap-2 text-xs text-ink-muted">
                    {t("branchAvailable")}
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
              {t("variantsNote", {
                variants: item.variants.length,
                modifiers: item.modifierGroups.length,
              })}
            </p>
          ) : null}
        </FormSection>

        <FormActions>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(item ? `/menu/items/${item.id}` : "/menu")}
          >
            {tCommon("cancel")}
          </Button>
          <Button type="submit">{item ? t("save") : t("create")}</Button>
        </FormActions>
      </Card>
    </form>
  );
}
