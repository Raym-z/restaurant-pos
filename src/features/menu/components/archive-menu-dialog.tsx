"use client";

import { Archive, TriangleAlert } from "lucide-react";
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

import { archiveMenuCategoryAction, archiveMenuItemAction } from "../actions";
import { useMenuErrorMessage } from "../use-menu-error-message";

export function ArchiveMenuDialog({
  kind,
  id,
  name,
  redirectTo,
}: {
  kind: "category" | "item";
  id: string;
  name: string;
  /** Optional destination after a successful archive. */
  redirectTo?: string;
}) {
  const t = useTranslations("menuAdmin");
  const router = useRouter();
  const errorMessage = useMenuErrorMessage();
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

  function handleArchive() {
    setError(null);
    startTransition(async () => {
      const result =
        kind === "category" ? await archiveMenuCategoryAction(id) : await archiveMenuItemAction(id);

      if (!result.ok) {
        setError(errorMessage(result.error));
        if (result.committed) {
          setUncertain(true);
          router.refresh();
        }
        return;
      }

      setOpen(false);
      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    });
  }

  const title =
    kind === "category" ? t("archive.categoryTitle", { name }) : t("archive.itemTitle", { name });
  const description =
    kind === "category" ? t("archive.categoryDescription") : t("archive.itemDescription");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Archive />
          {t("archive.action")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft/50 px-3 py-2 text-sm text-danger"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="rounded-lg border border-warning/25 bg-warning-soft/50 px-3 py-2 text-sm text-ink">
          {t("archive.warning")}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => handleOpenChange(false)} disabled={isPending}>
            {t("archive.keep")}
          </Button>
          <Button
            variant="danger"
            onClick={handleArchive}
            isLoading={isPending}
            disabled={uncertain}
          >
            <Archive />
            {t("archive.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
