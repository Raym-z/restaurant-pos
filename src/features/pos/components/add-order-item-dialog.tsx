"use client";

import { Plus } from "lucide-react";
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

import { addOrderItemAction } from "../actions";
import type { DraftOrderLine, PosMenu } from "../types";
import { usePosErrorMessage } from "../use-pos-error-message";
import { ActionError } from "./action-feedback";
import { MenuItemPicker } from "./menu-item-picker";

export function AddOrderItemDialog({
  orderId,
  orderReference,
  menu,
}: {
  orderId: string;
  orderReference: string;
  menu: PosMenu;
}) {
  const t = useTranslations("orders.items");
  const router = useRouter();
  const errorMessage = usePosErrorMessage();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (isPending) {
      return;
    }
    setOpen(next);
    if (!next) {
      setError(null);
      setUncertain(false);
    }
  }

  function handleAdd(line: DraftOrderLine) {
    setError(null);
    startTransition(async () => {
      const result = await addOrderItemAction({
        orderId,
        menuItemId: line.menuItemId,
        quantity: line.quantity,
        modifierOptionIds: line.modifierOptionIds,
        notes: line.notes || undefined,
      });

      if (!result.ok) {
        setError(errorMessage(result.error));
        if (result.committed) {
          setUncertain(true);
          router.refresh();
        }
        return;
      }

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Plus />
          {t("addAction")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("addTitle", { reference: orderReference })}</DialogTitle>
          <DialogDescription>{t("addDescription")}</DialogDescription>
        </DialogHeader>

        <ActionError message={error} />

        <MenuItemPicker
          menu={menu}
          submitLabel={t("addSubmit")}
          onAdd={handleAdd}
          isSubmitting={isPending || uncertain}
        />

        <DialogFooter>
          <Button variant="secondary" onClick={() => handleOpenChange(false)} disabled={isPending}>
            {t("cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
