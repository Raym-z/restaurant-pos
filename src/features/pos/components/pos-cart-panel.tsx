"use client";

import { Minus, Plus, Receipt, ShoppingCart, Trash2, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useLocalizedFormat } from "@/i18n/use-localized-format";

import type { PosCartState } from "../cart";
import { cartItemCount, cartLineCount, cartSubtotalMinor } from "../cart";
import { ActionError } from "./action-feedback";

export function PosCartPanel({
  cart,
  currency,
  orderNotes,
  onOrderNotesChange,
  onQuantityChange,
  onRemoveLine,
  onSubmit,
  onClear,
  isPending,
  uncertain,
  blocked,
  actionError,
}: {
  cart: PosCartState;
  currency: string;
  orderNotes: string;
  onOrderNotesChange: (value: string) => void;
  onQuantityChange: (key: string, quantity: number) => void;
  onRemoveLine: (key: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  isPending: boolean;
  uncertain: boolean;
  blocked: boolean;
  actionError: string | null;
}) {
  const t = useTranslations("pos.ordering");
  const format = useLocalizedFormat();
  const [clearOpen, setClearOpen] = useState(false);
  const displayCurrency = cart.lines[0]?.currency ?? currency;
  const subtotal = cartSubtotalMinor(cart);
  const editable = !isPending && !uncertain && !blocked;
  const canSubmit = cart.lines.length > 0 && !isPending && !blocked;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>{t("cart.title")}</CardTitle>
          <p className="mt-1 text-xs text-ink-subtle">
            {t("cart.lineCount", { count: cartLineCount(cart) })} ·{" "}
            {t("cart.itemCount", { count: cartItemCount(cart) })}
          </p>
        </div>
        {cart.lines.length > 0 ? (
          <Dialog open={clearOpen} onOpenChange={setClearOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" disabled={isPending || uncertain || blocked}>
                <Trash2 />
                {t("cart.clear")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("cart.clearTitle")}</DialogTitle>
                <DialogDescription>{t("cart.clearDescription")}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setClearOpen(false)}>
                  {t("cart.clearCancel")}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    onClear();
                    setClearOpen(false);
                  }}
                >
                  {t("cart.clearConfirm")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <ActionError message={actionError} />

        {uncertain ? (
          <div className="rounded-lg border border-warning/25 bg-warning-soft/50 px-3 py-2 text-sm">
            <p className="flex items-center gap-1.5 font-medium text-ink">
              <TriangleAlert className="size-4 text-warning" aria-hidden="true" />
              {t("cart.uncertainTitle")}
            </p>
            <p className="mt-1 text-ink-muted">{t("cart.uncertainDescription")}</p>
          </div>
        ) : null}

        {cart.lines.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line-strong bg-surface-subtle/60 px-4 py-10 text-center">
            <ShoppingCart className="mx-auto size-6 text-ink-subtle" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium text-ink">{t("cart.emptyTitle")}</p>
            <p className="mt-1 text-sm text-ink-muted">{t("cart.emptyDescription")}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {cart.lines.map((line) => (
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
                    onClick={() => onRemoveLine(line.key)}
                    disabled={!editable}
                    aria-label={t("cart.removeLine")}
                  >
                    <Trash2 />
                  </Button>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      onClick={() => onQuantityChange(line.key, line.quantity - 1)}
                      disabled={line.quantity <= 1 || !editable}
                      aria-label={t("cart.decreaseQuantity")}
                    >
                      <Minus />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium text-ink">
                      {line.quantity}
                    </span>
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      onClick={() => onQuantityChange(line.key, line.quantity + 1)}
                      disabled={line.quantity >= 99 || !editable}
                      aria-label={t("cart.increaseQuantity")}
                    >
                      <Plus />
                    </Button>
                  </div>
                  <span className="text-sm font-medium text-ink">
                    {format.currencyAmount(line.unitPriceMinor * line.quantity, line.currency)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {cart.lines.length > 0 ? (
          <div className="space-y-2">
            <Label htmlFor="pos-order-notes">{t("cart.orderNotes")}</Label>
            <Textarea
              id="pos-order-notes"
              value={orderNotes}
              onChange={(event) => onOrderNotesChange(event.target.value)}
              maxLength={1000}
              rows={2}
              placeholder={t("cart.orderNotesPlaceholder")}
              disabled={!editable}
            />
          </div>
        ) : null}

        <div className="mt-auto space-y-3 border-t border-line pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-muted">{t("cart.subtotal")}</span>
            <span className="text-xl font-semibold tracking-tight text-ink">
              {format.currencyAmount(subtotal, displayCurrency)}
            </span>
          </div>
          <p className="text-xs text-ink-subtle">{t("cart.estimatedNotice")}</p>
          <Button className="w-full" onClick={onSubmit} isLoading={isPending} disabled={!canSubmit}>
            <Receipt />
            {uncertain ? t("cart.retry") : t("cart.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
