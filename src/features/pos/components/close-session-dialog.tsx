"use client";

import { DoorClosed } from "lucide-react";
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

import { closeDiningSessionAction } from "../actions";
import { usePosErrorMessage } from "../use-pos-error-message";
import { ActionError } from "./action-feedback";

export function CloseSessionDialog({
  sessionId,
  tableLabel,
  activeOrderCount,
}: {
  sessionId: string;
  tableLabel: string;
  activeOrderCount: number;
}) {
  const t = useTranslations("tables.session");
  const router = useRouter();
  const errorMessage = usePosErrorMessage();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [isPending, startTransition] = useTransition();
  const blocked = activeOrderCount > 0;

  function handleOpenChange(next: boolean) {
    if (isPending) {
      return;
    }
    setOpen(next);
    if (!next) {
      setError(null);
      setUncertain(false);
      setReason("");
    }
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await closeDiningSessionAction(sessionId, reason.trim() || undefined);
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
        <Button variant="secondary">
          <DoorClosed />
          {t("closeAction")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("closeTitle", { table: tableLabel })}</DialogTitle>
          <DialogDescription>{t("closeDescription")}</DialogDescription>
        </DialogHeader>

        <ActionError message={error} />

        {blocked ? (
          <div
            role="status"
            className="rounded-lg border border-warning/20 bg-warning-soft/50 px-3 py-2 text-sm text-warning"
          >
            {t("closeBlocked", { count: activeOrderCount })}
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="close-session-reason">{t("closeReason")}</Label>
          <Textarea
            id="close-session-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
            rows={3}
            placeholder={t("closeReasonPlaceholder")}
            disabled={isPending}
          />
          <p className="text-xs text-ink-subtle">{t("optional")}</p>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => handleOpenChange(false)} disabled={isPending}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} isLoading={isPending} disabled={blocked || uncertain}>
            <DoorClosed />
            {t("closeConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
