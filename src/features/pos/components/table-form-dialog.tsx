"use client";

import { Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormField, FormGrid } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type { ValidationErrors } from "@/features/shared/validation";

import { createTableAction, updateTableAction } from "../actions";
import type { TableSummary } from "../contracts";
import { validateTableForm } from "../table-management";
import { usePosErrorMessage } from "../use-pos-error-message";
import { ActionError, ActionSuccess } from "./action-feedback";

export function TableFormDialog({
  mode,
  branchId,
  table,
}: {
  mode: "create" | "edit";
  branchId: string;
  table?: TableSummary;
}) {
  const t = useTranslations("tables.manage");
  const tValidation = useTranslations("validation");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const errorMessage = usePosErrorMessage();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(table?.label ?? "");
  const [capacity, setCapacity] = useState(table ? String(table.capacity) : "");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdTableId, setCreatedTableId] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setLabel(table?.label ?? "");
    setCapacity(table ? String(table.capacity) : "");
    setErrors({});
    setSubmitted(false);
    setActionError(null);
    setSuccess(null);
    setCreatedTableId(null);
    setUncertain(false);
  }

  function handleOpenChange(next: boolean) {
    if (isPending) {
      return;
    }

    setOpen(next);
    if (!next) {
      reset();
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setActionError(null);

    const nextErrors = validateTableForm({ label, capacity }, tValidation);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const trimmedLabel = label.trim();
    const parsedCapacity = Number(capacity);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createTableAction({
              branchId,
              label: trimmedLabel,
              capacity: parsedCapacity,
            })
          : await updateTableAction(table?.tableId ?? "", {
              label: trimmedLabel,
              capacity: parsedCapacity,
            });

      if (!result.ok) {
        setActionError(errorMessage(result.error));
        if (result.committed) {
          setUncertain(true);
          router.refresh();
        }
        return;
      }

      setSuccess(
        mode === "create"
          ? t("createSuccess", { table: trimmedLabel })
          : t("editSuccess", { table: trimmedLabel }),
      );
      if (mode === "create") {
        setCreatedTableId(result.data.tableId);
      }
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button>
            <Plus />
            {t("createAction")}
          </Button>
        ) : (
          <Button variant="secondary" size="sm">
            <Pencil />
            {t("editAction")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("createTitle") : t("editTitle", { table: table?.label ?? "" })}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" ? t("createDescription") : t("editDescription")}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4">
            <ActionSuccess message={success} />
            <DialogFooter>
              {createdTableId ? (
                <Button asChild>
                  <Link href={`/tables/${createdTableId}`}>{t("viewCreated")}</Link>
                </Button>
              ) : null}
              <Button variant="secondary" onClick={() => handleOpenChange(false)}>
                {t("close")}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {submitted && Object.keys(errors).length > 0 ? (
              <p role="alert" className="text-sm text-danger">
                {tCommon("reviewFields")}
              </p>
            ) : null}

            <ActionError message={actionError} />

            {uncertain ? <p className="text-sm text-ink-muted">{t("uncertain")}</p> : null}

            <FormGrid>
              <FormField
                label={t("label")}
                htmlFor="table-label"
                required
                error={errors.label}
                className="sm:col-span-2"
              >
                <Input
                  id="table-label"
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  aria-invalid={Boolean(errors.label)}
                  aria-describedby={errors.label ? "table-label-error" : undefined}
                  placeholder={t("labelPlaceholder")}
                  maxLength={80}
                  disabled={isPending || uncertain}
                />
              </FormField>

              <FormField
                label={t("capacity")}
                htmlFor="table-capacity"
                required
                error={errors.capacity}
                description={t("capacityHint")}
              >
                <Input
                  id="table-capacity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={32767}
                  step={1}
                  value={capacity}
                  onChange={(event) => setCapacity(event.target.value)}
                  aria-invalid={Boolean(errors.capacity)}
                  aria-describedby={
                    errors.capacity ? "table-capacity-error" : "table-capacity-description"
                  }
                  placeholder={t("capacityPlaceholder")}
                  disabled={isPending || uncertain}
                />
              </FormField>
            </FormGrid>

            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" isLoading={isPending} disabled={uncertain}>
                {mode === "create" ? t("createConfirm") : t("saveConfirm")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
