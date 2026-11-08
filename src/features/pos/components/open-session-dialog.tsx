"use client";

import { DoorOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

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

import { openDiningSessionAction } from "../actions";
import { usePosErrorMessage } from "../use-pos-error-message";
import { ActionError } from "./action-feedback";

export function OpenSessionDialog({
  tableId,
  tableLabel,
}: {
  tableId: string;
  tableLabel: string;
}) {
  const t = useTranslations("tables.session");
  const router = useRouter();
  const errorMessage = usePosErrorMessage();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const idempotencyKey = useRef<string | null>(null);

  function handleOpenChange(next: boolean) {
    if (isPending) {
      return;
    }
    setOpen(next);
    if (!next) {
      setError(null);
      idempotencyKey.current = null;
    }
  }

  function handleSubmit() {
    setError(null);
    idempotencyKey.current ??= globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`;

    startTransition(async () => {
      const result = await openDiningSessionAction(tableId, idempotencyKey.current ?? undefined);
      if (!result.ok) {
        setError(errorMessage(result.error));
        return;
      }

      idempotencyKey.current = null;
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <DoorOpen />
          {t("openAction")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("openTitle", { table: tableLabel })}</DialogTitle>
          <DialogDescription>{t("openDescription")}</DialogDescription>
        </DialogHeader>

        <ActionError message={error} />

        <div className="rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-ink-muted">
          {t("openNotice")}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => handleOpenChange(false)} disabled={isPending}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} isLoading={isPending}>
            <DoorOpen />
            {t("openConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
