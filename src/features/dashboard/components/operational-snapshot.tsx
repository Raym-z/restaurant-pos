"use client";

import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";

import { useLocalizedFormat } from "@/i18n/use-localized-format";
import type { OperationalSnapshot as OperationalSnapshotData } from "../types";

export function OperationalSnapshot({ snapshot }: { snapshot: OperationalSnapshotData }) {
  const t = useTranslations("dashboard.operations");
  const format = useLocalizedFormat();
  const seatedRatio = snapshot.tablesTotal > 0 ? snapshot.tablesSeated / snapshot.tablesTotal : 0;

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-ink">{t("title")}</h2>
      <p className="text-sm text-ink-muted">{t("subtitle")}</p>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-surface-subtle p-3">
          <dt className="text-xs font-medium text-ink-subtle">{t("kitchenOrders")}</dt>
          <dd className="mt-1 text-xl font-semibold text-ink">
            {format.number(snapshot.kitchenOpenOrders)}
          </dd>
        </div>
        <div className="rounded-lg bg-surface-subtle p-3">
          <dt className="text-xs font-medium text-ink-subtle">{t("guestsWaiting")}</dt>
          <dd className="mt-1 text-xl font-semibold text-ink">
            {format.number(snapshot.guestsWaiting)}
          </dd>
        </div>
        <div className="rounded-lg bg-surface-subtle p-3">
          <dt className="text-xs font-medium text-ink-subtle">{t("staffOnShift")}</dt>
          <dd className="mt-1 text-xl font-semibold text-ink">
            {format.number(snapshot.staffOnShift)}
          </dd>
        </div>
        <div className="rounded-lg bg-surface-subtle p-3">
          <dt className="text-xs font-medium text-ink-subtle">{t("tablesSeated")}</dt>
          <dd className="mt-1 text-xl font-semibold text-ink">
            {format.number(snapshot.tablesSeated)}
            <span className="text-sm font-normal text-ink-subtle">
              {" "}
              / {format.number(snapshot.tablesTotal)}
            </span>
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-ink-subtle">
          <span>{t("seatingOccupancy")}</span>
          <span>{format.percent(seatedRatio)}</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-brand"
            style={{ width: `${Math.round(seatedRatio * 100)}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
