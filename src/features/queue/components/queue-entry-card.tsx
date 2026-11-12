"use client";

import { Bell, CalendarClock, Clock, Lock, Phone, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { cn } from "@/lib/utils";

import type { QueueEntry } from "../contracts";
import { QueueStatusBadge } from "./queue-status-badge";

export function QueueEntryCard({ entry, timezone }: { entry: QueueEntry; timezone: string }) {
  const t = useTranslations("queue.entry");
  const format = useLocalizedFormat();
  const displayName = entry.displayName?.trim() || t("unnamed");
  const phone = entry.contactPhone?.trim() ? entry.contactPhone : null;
  const elapsed =
    entry.elapsedMinutes < 1
      ? t("lessThanMinute")
      : t("elapsed", { minutes: format.number(entry.elapsedMinutes) });

  return (
    <article
      aria-label={t("ariaLabel", { position: entry.position, name: displayName })}
      className="grid gap-4 rounded-xl border border-line bg-surface p-4 shadow-card sm:grid-cols-[auto_1fr]"
    >
      <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:justify-center">
        <span
          aria-label={t("position", { position: entry.position })}
          className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-lg font-semibold text-brand-ink"
        >
          {entry.position}
        </span>
        <span className="text-xs font-medium tracking-[0.12em] text-ink-subtle uppercase sm:hidden">
          {t("position", { position: entry.position })}
        </span>
      </div>

      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-ink">{displayName}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <QueueStatusBadge status={entry.status} />
              <Badge variant="outline">
                {t(entry.source === "customer" ? "source.customer" : "source.walk_in")}
              </Badge>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-ink-muted">
            <Clock className="size-3.5" aria-hidden="true" />
            {elapsed}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-ink-subtle uppercase">
              <Users className="size-3.5" aria-hidden="true" />
              {t("partySizeLabel")}
            </dt>
            <dd className="mt-0.5 text-ink">{t("partySize", { count: entry.partySize })}</dd>
          </div>

          <div>
            <dt className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-ink-subtle uppercase">
              <CalendarClock className="size-3.5" aria-hidden="true" />
              {t("joinedLabel")}
            </dt>
            <dd className="mt-0.5 text-ink">{format.dateTime(entry.joinedAt, timezone)}</dd>
          </div>

          <div>
            <dt className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-ink-subtle uppercase">
              {entry.contactPhoneMasked ? (
                <Lock className="size-3.5" aria-hidden="true" />
              ) : (
                <Phone className="size-3.5" aria-hidden="true" />
              )}
              {t("phoneLabel")}
            </dt>
            <dd className={cn("mt-0.5", phone ? "text-ink" : "text-ink-subtle")}>
              {phone ?? t("noPhone")}
              {entry.contactPhoneMasked ? (
                <span className="sr-only"> — {t("maskedPhone")}</span>
              ) : null}
            </dd>
          </div>
        </dl>

        {entry.status === "notified" && entry.notifiedAt ? (
          <p className="flex items-center gap-1.5 text-xs text-ink-subtle">
            <Bell className="size-3.5" aria-hidden="true" />
            {t("notifiedAt", { time: format.dateTime(entry.notifiedAt, timezone) })}
          </p>
        ) : null}
      </div>
    </article>
  );
}
