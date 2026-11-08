"use client";

import { Ban } from "lucide-react";
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

import { cancelOrderAction } from "../actions";
import { usePosErrorMessage } from "../use-pos-error-message";
import { ActionError } from "./action-feedback";

export function CancelOrderDialog({
  orderId,
  orderReference,
}: {
  orderId: string;
  orderReference: string;
}) {
  const t = useTranslations("orders.cancel");
  const router = useRouter();
  const errorMessage = usePosErrorMessage();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [isPending, startTransition] = useTransition();
  const trimmedReason = reason.trim();
  const tooLong = trimmedReason.length > 500;

  function handleOpenChange(next: boolean) {
    if (isPending) {
      return;
    }
    setOpen(next);
    if (!next) {
      setReason("");
      setError(null);
      setUncertain(false);
    }
  }

  function handleSubmit() {
    if (!trimmedReason || tooLong) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await cancelOrderAction(orderId, trimmedReason);
      if (!result.ok) {
        setError(errorMessage(result.error));
        if (result.committed) {
          setUncertain(true);
          router.refresh();
        }
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
        <Button variant="danger">
          <Ban />
          {t("action")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title", { reference: orderReference })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <ActionError message={error} />

        <div className="space-y-2">
          <Label htmlFor="cancel-order-reason" required>
            {t("reason")}
          </Label>
          <Textarea
            id="cancel-order-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
            rows={3}
            placeholder={t("reasonPlaceholder")}
            disabled={isPending}
            aria-invalid={tooLong}
          />
          <p className="text-xs text-ink-subtle">{t("reasonHint")}</p>
        </div>

        <div className="rounded-lg border border-danger/20 bg-danger-soft/40 px-3 py-2 text-sm text-danger">
          {t("warning")}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => handleOpenChange(false)} disabled={isPending}>
            {t("keepOrder")}
          </Button>
          <Button
            variant="danger"
            onClick={handleSubmit}
            isLoading={isPending}
            disabled={!trimmedReason || tooLong || uncertain}
          >
            <Ban />
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
