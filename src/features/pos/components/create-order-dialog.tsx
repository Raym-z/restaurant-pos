"use client";

import { Minus, Plus, Receipt, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";

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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrencyAmount } from "@/lib/currency";

import { createOrderAction } from "../actions";
import type { DraftOrderLine, PosMenu } from "../types";
import { usePosErrorMessage } from "../use-pos-error-message";
import { ActionError } from "./action-feedback";
import { MenuItemPicker } from "./menu-item-picker";

export function CreateOrderDialog({
  diningSessionId,
  tableLabel,
  menu,
}: {
  diningSessionId: string;
  tableLabel: string;
  menu: PosMenu;
}) {
  const t = useTranslations("tables.order");
  const router = useRouter();
  const errorMessage = usePosErrorMessage();
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<DraftOrderLine[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const idempotencyKey = useRef<string | null>(null);
  const keySignature = useRef<string | null>(null);

  const totalMinor = useMemo(
    () => lines.reduce((total, line) => total + line.unitPriceMinor * line.quantity, 0),
    [lines],
  );
  const currency = lines[0]?.currency ?? menu.categories[0]?.items[0]?.currency ?? "IDR";
  const contentSignature = useMemo(
    () =>
      JSON.stringify({
        lines: lines.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          modifierOptionIds: line.modifierOptionIds,
          notes: line.notes,
        })),
        notes: notes.trim(),
      }),
    [lines, notes],
  );

  function reset() {
    setLines([]);
    setNotes("");
    setError(null);
    idempotencyKey.current = null;
    keySignature.current = null;
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

  function addLine(line: DraftOrderLine) {
    setLines((current) => {
      const existing = current.find(
        (entry) =>
          entry.menuItemId === line.menuItemId &&
          entry.notes === line.notes &&
          entry.modifierOptionIds.length === line.modifierOptionIds.length &&
          entry.modifierOptionIds.every((id) => line.modifierOptionIds.includes(id)),
      );

      if (existing) {
        return current.map((entry) =>
          entry.key === existing.key
            ? { ...entry, quantity: Math.min(99, entry.quantity + line.quantity) }
            : entry,
        );
      }

      return [...current, line];
    });
  }

  function setQuantity(key: string, quantity: number) {
    setLines((current) =>
      current.map((line) =>
        line.key === key ? { ...line, quantity: Math.min(99, Math.max(1, quantity)) } : line,
      ),
    );
  }

  function removeLine(key: string) {
    setLines((current) => current.filter((line) => line.key !== key));
  }

  function handleSubmit() {
    if (lines.length === 0) {
      return;
    }

    setError(null);
    if (keySignature.current !== contentSignature) {
      keySignature.current = contentSignature;
      idempotencyKey.current = globalThis.crypto?.randomUUID?.() ?? `order-${Date.now()}`;
    }

    startTransition(async () => {
      const result = await createOrderAction({
        diningSessionId,
        items: lines.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          modifierOptionIds: line.modifierOptionIds,
          notes: line.notes || undefined,
        })),
        notes: notes.trim() || undefined,
        idempotencyKey: idempotencyKey.current ?? undefined,
      });

      if (!result.ok) {
        setError(errorMessage(result.error));
        return;
      }

      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Receipt />
          {t("createAction")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("createTitle", { table: tableLabel })}</DialogTitle>
          <DialogDescription>{t("createDescription")}</DialogDescription>
        </DialogHeader>

        <ActionError message={error} />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <section className="min-w-0">
            <MenuItemPicker
              menu={menu}
              submitLabel={t("addToOrder")}
              onAdd={addLine}
              isSubmitting={isPending}
            />
          </section>

          <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-surface-subtle/60 p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">{t("draftTitle")}</h3>
              <span className="text-xs text-ink-subtle">
                {t("lineCount", { count: lines.length })}
              </span>
            </div>

            {lines.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line-strong bg-surface px-3 py-8 text-center text-sm text-ink-muted">
                {t("draftEmpty")}
              </p>
            ) : (
              <ul className="space-y-2">
                {lines.map((line) => (
                  <li key={line.key} className="rounded-lg border border-line bg-surface p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{line.name}</p>
                        {line.modifierLabels.length > 0 ? (
                          <p className="mt-0.5 text-xs text-ink-subtle">
                            {line.modifierLabels.join(" · ")}
                          </p>
                        ) : null}
                        {line.notes ? (
                          <p className="mt-0.5 text-xs text-ink-subtle">{line.notes}</p>
                        ) : null}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeLine(line.key)}
                        disabled={isPending}
                        aria-label={t("removeLine")}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="secondary"
                          size="icon-sm"
                          onClick={() => setQuantity(line.key, line.quantity - 1)}
                          disabled={line.quantity <= 1 || isPending}
                          aria-label={t("decreaseQuantity")}
                        >
                          <Minus />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium text-ink">
                          {line.quantity}
                        </span>
                        <Button
                          variant="secondary"
                          size="icon-sm"
                          onClick={() => setQuantity(line.key, line.quantity + 1)}
                          disabled={line.quantity >= 99 || isPending}
                          aria-label={t("increaseQuantity")}
                        >
                          <Plus />
                        </Button>
                      </div>
                      <span className="text-sm font-medium text-ink">
                        {formatCurrencyAmount(line.unitPriceMinor * line.quantity, line.currency)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-2">
              <Label htmlFor="create-order-notes">{t("orderNotes")}</Label>
              <Textarea
                id="create-order-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={1000}
                rows={2}
                placeholder={t("orderNotesPlaceholder")}
                disabled={isPending}
              />
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
              <span className="text-sm text-ink-muted">{t("total")}</span>
              <span className="text-lg font-semibold text-ink">
                {formatCurrencyAmount(totalMinor, currency)}
              </span>
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => handleOpenChange(false)} disabled={isPending}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} isLoading={isPending} disabled={lines.length === 0}>
            <Receipt />
            {t("submitOrder")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
