"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormActions, FormField, FormGrid, FormSection } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ValidationErrors } from "@/features/shared/validation";

import { createMenuCategoryAction, updateMenuCategoryAction } from "../actions";
import { validateCategoryForm } from "../form-validation";
import type { MenuCategoryView } from "../models";
import { nextSortOrder } from "../models";
import { useMenuErrorMessage } from "../use-menu-error-message";
import { MenuReadOnlyNotice } from "./menu-read-only-notice";

export function MenuCategoryForm({
  category,
  categories,
  canManage,
}: {
  category?: MenuCategoryView;
  categories: MenuCategoryView[];
  canManage: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("menuAdmin");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const errorMessage = useMenuErrorMessage();

  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [sortOrder, setSortOrder] = useState(
    String(category?.sortOrder ?? nextSortOrder(categories)),
  );
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!canManage) {
    return <MenuReadOnlyNotice />;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setActionError(null);

    const nextErrors = validateCategoryForm(
      { name, description, sortOrder },
      categories,
      category?.id,
      tValidation,
    );
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const input = {
      name: name.trim(),
      description: description.trim(),
      sortOrder: Number(sortOrder),
    };

    startTransition(async () => {
      const result = category
        ? await updateMenuCategoryAction(category.id, input)
        : await createMenuCategoryAction(input);

      if (!result.ok) {
        setActionError(errorMessage(result.error));
        if (result.committed) {
          setUncertain(true);
          router.refresh();
        }
        return;
      }

      router.push("/menu/categories");
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

      {category?.status === "archived" ? (
        <div className="rounded-lg border border-line bg-surface-subtle px-4 py-3 text-sm text-ink-muted">
          {t("archive.archivedNote")}
        </div>
      ) : null}

      <Card className="space-y-6 p-5 sm:p-6">
        <FormSection
          title={t("form.sections.details")}
          description={t("form.sections.detailsDescription")}
        >
          <FormGrid>
            <FormField
              label={t("form.fields.name")}
              htmlFor="category-name"
              required
              error={errors.name}
            >
              <Input
                id="category-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "category-name-error" : undefined}
                placeholder={t("form.placeholders.name")}
                disabled={isPending || uncertain || category?.status === "archived"}
              />
            </FormField>
            <FormField
              label={t("form.fields.sortOrder")}
              htmlFor="category-sort-order"
              required
              error={errors.sortOrder}
              description={t("form.hints.sortOrder")}
            >
              <Input
                id="category-sort-order"
                inputMode="numeric"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                aria-invalid={Boolean(errors.sortOrder)}
                aria-describedby={
                  errors.sortOrder ? "category-sort-order-error" : "category-sort-order-description"
                }
                placeholder={t("form.placeholders.sortOrder")}
                disabled={isPending || uncertain || category?.status === "archived"}
              />
            </FormField>
            <FormField
              label={t("form.fields.description")}
              htmlFor="category-description"
              error={errors.description}
              description={t("form.hints.description", { max: 240 })}
              className="sm:col-span-2"
            >
              <Textarea
                id="category-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={
                  errors.description
                    ? "category-description-error"
                    : "category-description-description"
                }
                rows={3}
                placeholder={t("form.placeholders.description")}
                disabled={isPending || uncertain || category?.status === "archived"}
              />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormActions>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/menu/categories")}
            disabled={isPending}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="submit"
            isLoading={isPending}
            disabled={uncertain || category?.status === "archived"}
          >
            {category ? t("form.saveCategory") : t("form.createCategory")}
          </Button>
        </FormActions>
      </Card>
    </form>
  );
}
