"use client";

import { Plus, Save } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createKitchenStationAction, updateKitchenStationAction } from "../actions";
import type { KitchenStation } from "../contracts";
import { useKitchenErrorMessage } from "../use-kitchen-error-message";
import { ActionError, ActionSuccess } from "@/features/pos/components/action-feedback";

export function StationFormDialog({
  mode,
  branchId,
  station,
  onSaved,
}: {
  mode: "create" | "edit";
  branchId: string;
  station?: KitchenStation;
  onSaved: (station: KitchenStation) => void;
}) {
  const t = useTranslations("kitchen.stations");
  const router = useRouter();
  const errorMessage = useKitchenErrorMessage();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(station?.name ?? "");
  const [description, setDescription] = useState(station?.description ?? "");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    if (isPending) {
      return;
    }
    if (next) {
      setName(station?.name ?? "");
      setDescription(station?.description ?? "");
      setError(null);
      setSuccess(null);
    }
    setOpen(next);
  }

  async function handleSubmit() {
    setError(null);
    setSuccess(null);
    setIsPending(true);

    try {
      const result =
        mode === "create"
          ? await createKitchenStationAction({
              branchId,
              name,
              description: description.trim() ? description : null,
            })
          : await updateKitchenStationAction({
              stationId: station?.stationId ?? "",
              name,
              description: description.trim() ? description : null,
            });

      if (!result.ok) {
        setError(errorMessage(result.error));
        if (result.committed) {
          router.refresh();
        }
        return;
      }

      onSaved(result.data);
      setSuccess(
        mode === "create"
          ? t("createSuccess", { name: result.data.name })
          : t("updateSuccess", { name: result.data.name }),
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button>
            <Plus />
            {t("newStation")}
          </Button>
        ) : (
          <Button variant="secondary" size="sm">
            {t("edit")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("createTitle") : t("editTitle", { name: station?.name ?? "" })}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" ? t("createDescription") : t("editDescription")}
          </DialogDescription>
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

            <div className="space-y-2">
              <Label htmlFor={`station-name-${mode}`} required>
                {t("name")}
              </Label>
              <Input
                id={`station-name-${mode}`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={200}
                disabled={isPending}
                placeholder={t("namePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`station-description-${mode}`}>{t("description")}</Label>
              <Textarea
                id={`station-description-${mode}`}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={1000}
                rows={3}
                disabled={isPending}
                placeholder={t("descriptionPlaceholder")}
              />
              <p className="text-xs text-ink-subtle">{t("descriptionHint")}</p>
            </div>

            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                {t("cancel")}
              </Button>
              <Button onClick={handleSubmit} isLoading={isPending} disabled={!name.trim()}>
                <Save />
                {mode === "create" ? t("createAction") : t("saveAction")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
