"use client";

import { PowerOff } from "lucide-react";
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

import { deactivateTableAction } from "../actions";
import type { TableSummary } from "../contracts";
import { canDeactivateTable } from "../table-management";
import { usePosErrorMessage } from "../use-pos-error-message";
import { ActionError, ActionSuccess } from "./action-feedback";

export function DeactivateTableDialog({ table }: { table: TableSummary }) {
  const t = useTranslations("tables.manage");
  const router = useRouter();
  const errorMessage = usePosErrorMessage();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [isPending, startTransition] = useTransition();
  const blocked = !canDeactivateTable(table);

  function handleOpenChange(next: boolean) {
    if (isPending) {
      return;
    }

    setOpen(next);
    if (!next) {
      setReason("");
      setError(null);
      setSuccess(null);
      setUncertain(false);
    }
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await deactivateTableAction(table.tableId, reason.trim() || undefined);
      if (!result.ok) {
        setError(errorMessage(result.error));
        if (result.committed) {
          setUncertain(true);
          router.refresh();
        }
        return;
      }

      setSuccess(t("deactivateSuccess", { table: table.label }));
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <PowerOff />
          {t("deactivateAction")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deactivateTitle", { table: table.label })}</DialogTitle>
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

            {blocked ? (
              <div
                role="status"
                className="rounded-lg border border-warning/20 bg-warning-soft/50 px-3 py-2 text-sm text-warning"
              >
                {table.status === "inactive" ? t("deactivateInactive") : t("deactivateBlocked")}
              </div>
            ) : null}

            {uncertain ? <p className="text-sm text-ink-muted">{t("uncertain")}</p> : null}

            <div className="space-y-2">
              <Label htmlFor="table-deactivate-reason">{t("deactivateReason")}</Label>
              <Textarea
                id="table-deactivate-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={500}
                rows={3}
                placeholder={t("deactivateReasonPlaceholder")}
                disabled={isPending || uncertain || blocked}
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
              <Button
                variant="danger"
                onClick={handleSubmit}
                isLoading={isPending}
                disabled={blocked || uncertain}
              >
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
