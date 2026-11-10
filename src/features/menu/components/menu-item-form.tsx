"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormActions, FormField, FormGrid, FormSection } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ValidationErrors } from "@/features/shared/validation";
import { formatMoneyInput, parseMoneyInput } from "@/lib/currency";

import { createMenuItemAction, updateMenuItemAction } from "../actions";
import { validateItemForm } from "../form-validation";
import type { MenuCategoryView, MenuItemView } from "../models";
import { nextSortOrder } from "../models";
import { useMenuErrorMessage } from "../use-menu-error-message";
import { MenuReadOnlyNotice } from "./menu-read-only-notice";

export function MenuItemForm({
  item,
  items,
  categories,
  currency,
  canManage,
}: {
  item?: MenuItemView;
  items: MenuItemView[];
  categories: MenuCategoryView[];
  currency: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("menuAdmin");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const errorMessage = useMenuErrorMessage();

  const selectableCategories = categories.filter(
    (category) => category.status === "active" || category.id === item?.categoryId,
  );

  const [categoryId, setCategoryId] = useState(
    item?.categoryId ?? selectableCategories[0]?.id ?? "",
  );
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(
    item ? formatMoneyInput(item.basePriceMinor, item.currency) : "",
  );
  const [sortOrder, setSortOrder] = useState(String(item?.sortOrder ?? nextSortOrder(categories)));
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!canManage) {
    return <MenuReadOnlyNotice />;
  }

  if (selectableCategories.length === 0) {
    return (
      <Card className="space-y-4 p-5 text-sm sm:p-6">
        <p className="text-ink-muted">{t("empty.categoriesDescription")}</p>
        <Button asChild>
          <Link href="/menu/categories/new">{t("newCategory")}</Link>
        </Button>
      </Card>
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setActionError(null);

    const parsedPrice = parseMoneyInput(price, currency);
    const nextErrors = validateItemForm(
      {
        categoryId,
        name,
        description,
        basePriceMinor: parsedPrice,
        sortOrder,
      },
      items,
      item?.id,
      tValidation,
      currency,
    );
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || parsedPrice === null) {
      return;
    }

    const values = {
      name: name.trim(),
      description: description.trim(),
      basePriceMinor: parsedPrice,
      sortOrder: Number(sortOrder),
    };

    startTransition(async () => {
      const result = item
        ? await updateMenuItemAction(item.id, values)
        : await createMenuItemAction({ ...values, categoryId });

      if (!result.ok) {
        setActionError(errorMessage(result.error));
        if (result.committed) {
          setUncertain(true);
          router.refresh();
        }
        return;
      }

      router.push(`/menu/items/${result.data.menuItemId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {submitted && Object.keys(errors).length > 0 ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft/50 px-4 py-3 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{tCommon("reviewFields")}</p>
        </div>
      ) : null}

      {actionError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft/50 px-4 py-3 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{actionError}</p>
        </div>
      ) : null}

      {item?.status === "archived" ? (
        <div className="rounded-lg border border-line bg-surface-subtle px-4 py-3 text-sm text-ink-muted">
          {t("item.archivedDescription")}
        </div>
      ) : null}

      <Card className="space-y-6 p-5 sm:p-6">
        <FormSection
          title={t("form.sections.details")}
          description={t("form.sections.detailsDescription")}
        >
          <FormGrid>
            <FormField
              label={t("form.fields.category")}
              htmlFor="item-category"
              required
              error={errors.categoryId}
              description={item ? t("form.hints.categoryLocked") : undefined}
            >
              <Select
                id="item-category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                aria-invalid={Boolean(errors.categoryId)}
                aria-describedby={
                  errors.categoryId ? "item-category-error" : "item-category-description"
                }
                disabled={Boolean(item) || isPending || uncertain}
              >
                <option value="">{t("form.placeholders.category")}</option>
                {selectableCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              label={t("form.fields.name")}
              htmlFor="item-name"
              required
              error={errors.name}
            >
              <Input
                id="item-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "item-name-error" : undefined}
                placeholder={t("form.placeholders.name")}
                disabled={isPending || uncertain || item?.status === "archived"}
              />
            </FormField>
            <FormField
              label={t("form.fields.description")}
              htmlFor="item-description"
              error={errors.description}
              description={t("form.hints.description", { max: 400 })}
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
                placeholder={t("form.placeholders.description")}
                disabled={isPending || uncertain || item?.status === "archived"}
              />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection
          title={t("form.sections.pricing")}
          description={t("form.sections.pricingDescription")}
        >
          <FormGrid>
            <FormField
              label={t("form.fields.basePrice")}
              htmlFor="item-price"
              required
              error={errors.basePriceMinor}
              description={t("form.hints.price", { currency })}
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
                placeholder={t("form.placeholders.price")}
                disabled={isPending || uncertain || item?.status === "archived"}
              />
            </FormField>
            <FormField
              label={t("form.fields.sortOrder")}
              htmlFor="item-sort-order"
              required
              error={errors.sortOrder}
              description={t("form.hints.sortOrder")}
            >
              <Input
                id="item-sort-order"
                inputMode="numeric"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                aria-invalid={Boolean(errors.sortOrder)}
                aria-describedby={
                  errors.sortOrder ? "item-sort-order-error" : "item-sort-order-description"
                }
                placeholder={t("form.placeholders.sortOrder")}
                disabled={isPending || uncertain || item?.status === "archived"}
              />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormActions>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(item ? `/menu/items/${item.id}` : "/menu")}
            disabled={isPending}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="submit"
            isLoading={isPending}
            disabled={uncertain || item?.status === "archived"}
          >
            {item ? t("form.saveItem") : t("form.createItem")}
          </Button>
        </FormActions>
      </Card>
    </form>
  );
}
