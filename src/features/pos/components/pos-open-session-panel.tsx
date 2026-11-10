"use client";

import { DoorOpen, TableProperties, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { openDiningSessionAction } from "../actions";
import type { TableSummary } from "../contracts";
import { usePosErrorMessage } from "../use-pos-error-message";
import { ActionError } from "./action-feedback";

export function PosOpenSessionPanel({ table }: { table: TableSummary }) {
  const t = useTranslations("pos.ordering");
  const router = useRouter();
  const errorMessage = usePosErrorMessage();
  const idempotencyKey = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setError(null);
    idempotencyKey.current ??= globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`;

    startTransition(async () => {
      const result = await openDiningSessionAction(
        table.tableId,
        idempotencyKey.current ?? undefined,
      );

      if (!result.ok) {
        setError(errorMessage(result.error));
        if (result.committed) {
          setUncertain(true);
          router.refresh();
          return;
        }

        // A concurrent open (or an already-resumed session) must be reloaded
        // instead of retried blindly.
        if (
          result.error.code === "RESOURCE_CONFLICT" ||
          result.error.code === "DINING_SESSION_NOT_FOUND"
        ) {
          router.refresh();
        }
        return;
      }

      idempotencyKey.current = null;
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("openSession.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="inline-flex items-center gap-2 font-semibold text-ink">
            <TableProperties className="size-4" aria-hidden="true" />
            {table.label}
          </span>
          <span className="inline-flex items-center gap-1.5 text-ink-muted">
            <Users className="size-4" aria-hidden="true" />
            {t("tableCard.capacity", { count: table.capacity })}
          </span>
          <Badge variant="success">{t("tableCard.available")}</Badge>
        </div>

        <p className="text-sm text-ink-muted">
          {t("openSession.description", { table: table.label })}
        </p>

        <ActionError message={error} />

        <div className="rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-ink-muted">
          {t("openSession.notice")}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleOpen} isLoading={isPending} disabled={uncertain}>
            <DoorOpen />
            {t("openSession.action")}
          </Button>
          <Button variant="secondary" onClick={() => router.refresh()} disabled={isPending}>
            {t("refresh")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
