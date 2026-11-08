"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { removeOrderItemAction } from "../actions";
import { usePosErrorMessage } from "../use-pos-error-message";
import { ActionError } from "./action-feedback";

export function RemoveOrderItemDialog({
  orderItemId,
  itemName,
}: {
  orderItemId: string;
  itemName: string;
}) {
  const t = useTranslations("orders.items");
  const router = useRouter();
  const errorMessage = usePosErrorMessage();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (isPending) {
      return;
    }
    setOpen(next);
    if (!next) {
      setReason("");
      setError(null);
    }
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await removeOrderItemAction(orderItemId, reason.trim() || undefined);
      if (!result.ok) {
        setError(errorMessage(result.error));
        return;
      }

      setOpen(false);
      setReason("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t("removeAction")}>
          <Trash2 />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("removeTitle", { item: itemName })}</DialogTitle>
          <DialogDescription>{t("removeDescription")}</DialogDescription>
        </DialogHeader>

        <ActionError message={error} />

        <div className="space-y-2">
          <Label htmlFor="remove-item-reason">{t("removeReason")}</Label>
          <Textarea
            id="remove-item-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
            rows={2}
            placeholder={t("removeReasonPlaceholder")}
            disabled={isPending}
          />
          <p className="text-xs text-ink-subtle">{t("removeReasonHint")}</p>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => handleOpenChange(false)} disabled={isPending}>
            {t("cancel")}
          </Button>
          <Button variant="danger" onClick={handleSubmit} isLoading={isPending}>
            <Trash2 />
            {t("removeConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
