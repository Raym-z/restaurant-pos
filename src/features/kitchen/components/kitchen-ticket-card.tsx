"use client";

import { Clock, StickyNote, Utensils } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { cn } from "@/lib/utils";

import { kitchenItemActionFor, type KitchenItemAction } from "../access";
import type { KitchenTicket } from "../contracts";
import {
  elapsedMinutes,
  kitchenTicketItemProgress,
  kitchenUrgencyForMinutes,
  type KitchenTicketUrgency,
} from "../selectors";
import { KitchenItemStatusBadge, KitchenTicketStatusBadge } from "./kitchen-status-badges";

const ACTION_LABEL_KEYS: Record<KitchenItemAction, string> = {
  start: "actions.start",
  markReady: "actions.markReady",
  complete: "actions.complete",
};

const URGENCY_CLASSES: Record<KitchenTicketUrgency, string> = {
  normal: "border-line",
  warning: "border-warning/50 ring-1 ring-warning/20",
  urgent: "border-danger/50 ring-1 ring-danger/20",
};

const URGENCY_BADGE: Record<KitchenTicketUrgency, "neutral" | "warning" | "danger"> = {
  normal: "neutral",
  warning: "warning",
  urgent: "danger",
};

export function KitchenTicketCard({
  ticket,
  now,
  timezone,
  canOperate,
  interactive = false,
  pendingItemIds,
  onItemAction,
  showCancellation = false,
}: {
  ticket: KitchenTicket;
  now: string;
  timezone: string;
  canOperate: boolean;
  interactive?: boolean;
  pendingItemIds?: ReadonlySet<string>;
  onItemAction?: (ticketItemId: string, action: KitchenItemAction) => void;
  showCancellation?: boolean;
}) {
  const t = useTranslations("kitchen");
  const format = useLocalizedFormat();
  const minutes = elapsedMinutes(ticket.createdAt, now);
  const urgency = kitchenUrgencyForMinutes(minutes);
  const progress = kitchenTicketItemProgress(ticket);
  const actionPending = (pendingItemIds?.size ?? 0) > 0;
  const elapsedLabel =
    minutes < 1 ? t("card.lessThanMinute") : t("card.minutes", { minutes: format.number(minutes) });

  return (
    <article
      aria-label={t("card.ariaLabel", {
        reference: ticket.order.orderReference,
        station: ticket.stationName,
      })}
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-xl border bg-surface shadow-card",
        URGENCY_CLASSES[interactive ? urgency : "normal"],
      )}
    >
      <header className="space-y-3 border-b border-line bg-surface-subtle/60 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <KitchenTicketStatusBadge status={ticket.status} />
          <Badge variant="outline" className="max-w-full truncate">
            {ticket.stationName}
          </Badge>
          {interactive ? (
            <Badge variant={URGENCY_BADGE[urgency]} className="ml-auto">
              <Clock aria-hidden="true" />
              {elapsedLabel}
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.12em] text-ink-subtle uppercase">
              {t("card.order")}
            </p>
            <h2 className="truncate text-2xl font-semibold tracking-tight text-ink">
              {ticket.order.orderReference}
            </h2>
          </div>
          <Badge variant={ticket.order.tableLabel ? "brand" : "neutral"} className="text-sm">
            {ticket.order.tableLabel ?? t("card.noTable")}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
          <span>{format.dateTime(ticket.createdAt, timezone)}</span>
          <span aria-hidden="true">·</span>
          <span>
            {t("card.progress", { completed: progress.completed, total: progress.total })}
          </span>
        </div>

        {ticket.order.notes ? (
          <p className="flex items-start gap-2 rounded-lg bg-warning-soft/50 px-3 py-2 text-sm text-ink">
            <StickyNote className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
            <span>
              <span className="font-medium">{t("card.orderNotes")}: </span>
              {ticket.order.notes}
            </span>
          </p>
        ) : null}

        {showCancellation && ticket.status === "cancelled" && ticket.cancellationReason ? (
          <p className="rounded-lg bg-surface-muted px-3 py-2 text-sm text-ink-muted">
            <span className="font-medium">{t("history.cancellationReason")}: </span>
            {ticket.cancellationReason}
          </p>
        ) : null}
      </header>

      <ul className="flex-1 divide-y divide-line">
        {ticket.items.map((item) => {
          const descriptor = kitchenItemActionFor(item.status);
          const itemPending = pendingItemIds?.has(item.ticketItemId) ?? false;
          const cancelled = item.status === "cancelled";
          const disabled =
            !interactive ||
            !canOperate ||
            actionPending ||
            item.status === "completed" ||
            item.status === "cancelled";

          return (
            <li
              key={item.ticketItemId}
              className={cn("space-y-2 p-4", cancelled && "bg-surface-muted/50 opacity-75")}
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex min-w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft px-2 py-1 text-sm font-semibold text-brand-ink"
                  aria-label={t("card.quantity", { count: item.quantity })}
                >
                  {item.quantity}×
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-base leading-6 font-semibold text-ink">{item.name}</p>
                  {item.modifiers.length > 0 ? (
                    <ul className="mt-1 space-y-0.5 text-sm text-ink-muted">
                      {item.modifiers.map((modifier) => (
                        <li key={`${item.ticketItemId}:${modifier.modifierOptionId}`}>
                          <Utensils
                            className="mr-1 inline size-3.5 text-ink-subtle"
                            aria-hidden="true"
                          />
                          {modifier.groupName}: {modifier.optionName}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {item.notes ? (
                    <p className="mt-1 rounded-md bg-warning-soft/60 px-2 py-1 text-sm text-ink">
                      <span className="font-medium">{t("card.itemNote")}: </span>
                      {item.notes}
                    </p>
                  ) : null}
                </div>
                <KitchenItemStatusBadge status={item.status} />
              </div>

              {interactive && descriptor ? (
                <div className="flex justify-end">
                  <Button
                    size="md"
                    variant={item.status === "pending" ? "primary" : "secondary"}
                    onClick={() => onItemAction?.(item.ticketItemId, descriptor.action)}
                    disabled={disabled}
                    isLoading={itemPending}
                    aria-label={t("card.actionLabel", {
                      action: t(ACTION_LABEL_KEYS[descriptor.action]),
                      item: item.name,
                    })}
                  >
                    {t(ACTION_LABEL_KEYS[descriptor.action])}
                  </Button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </article>
  );
}
