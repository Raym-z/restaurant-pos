"use client";

import { PowerOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
import { ActionError, ActionSuccess } from "@/features/pos/components/action-feedback";

import { deactivateKitchenStationAction } from "../actions";
import type { KitchenStation } from "../contracts";
import { useKitchenErrorMessage } from "../use-kitchen-error-message";

export function DeactivateStationDialog({
  station,
  onDeactivated,
}: {
  station: KitchenStation;
  onDeactivated: (station: KitchenStation) => void;
}) {
  const t = useTranslations("kitchen.stations");
  const router = useRouter();
  const errorMessage = useKitchenErrorMessage();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    if (isPending) {
      return;
    }

    setOpen(next);
    if (!next) {
      setReason("");
      setError(null);
      setSuccess(null);
    }
  }

  async function handleSubmit() {
    setError(null);
    setIsPending(true);

    try {
      const result = await deactivateKitchenStationAction({
        stationId: station.stationId,
        reason: reason.trim() || null,
      });

      if (!result.ok) {
        setError(errorMessage(result.error));
        if (result.committed) {
          router.refresh();
        }
        return;
      }

      onDeactivated(result.data);
      setSuccess(t("deactivateSuccess", { name: result.data.name }));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <PowerOff />
          {t("deactivate")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deactivateTitle", { name: station.name })}</DialogTitle>
          <DialogDescription>{t("deactivateDescription")}</DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4">
            <ActionSuccess message={success} />
            <DialogFooter>
              <Button variant="secondary" onClick={() => handleOpenChange(false)}>
                {t("close")}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <ActionError message={error} />

            <div
              role="status"
              className="rounded-lg border border-warning/20 bg-warning-soft/50 px-3 py-2 text-sm text-warning"
            >
              <p className="font-medium">{t("deactivateWarningTitle")}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>{t("deactivateWarningRouting")}</li>
                <li>{t("deactivateWarningExisting")}</li>
                <li>{t("deactivateWarningRestore")}</li>
                <li>{t("deactivateWarningNoDelete")}</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`station-deactivate-reason-${station.stationId}`}>
                {t("deactivateReason")}
              </Label>
              <Textarea
                id={`station-deactivate-reason-${station.stationId}`}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={500}
                rows={3}
                disabled={isPending}
                placeholder={t("deactivateReasonPlaceholder")}
              />
              <p className="text-xs text-ink-subtle">{t("deactivateReasonHint")}</p>
            </div>

            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                {t("cancel")}
              </Button>
              <Button variant="danger" onClick={handleSubmit} isLoading={isPending}>
                <PowerOff />
                {t("deactivateConfirm")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
