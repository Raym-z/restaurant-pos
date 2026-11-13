"use client";

import { BellRing, CheckCircle2, Clock, TableProperties, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { canOperateFloor } from "@/features/pos/access";
import { canViewQueue } from "@/features/queue/access";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import type { StaffRole } from "@/types/roles";

import type { DashboardAlert } from "../types";

interface AlertContent {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string | null;
  linkLabel: string;
  tone: "warning" | "info";
}

export function OperationalAlerts({
  alerts,
  roles,
}: {
  alerts: DashboardAlert[];
  roles: readonly StaffRole[];
}) {
  const t = useTranslations("dashboard.alerts");
  const format = useLocalizedFormat();
  const canOpenTables = canOperateFloor(roles);
  const canOpenQueue = canViewQueue(roles);

  function contentFor(alert: DashboardAlert): AlertContent {
    switch (alert.kind) {
      case "pending-orders":
        return {
          icon: Clock,
          title: t("pending.title"),
          description: t("pending.description", { count: alert.count }),
          href: "/orders?status=pending",
          linkLabel: t("pending.link"),
          tone: "warning",
        };
      case "ready-orders":
        return {
          icon: CheckCircle2,
          title: t("ready.title"),
          description: t("ready.description", { count: alert.count }),
          href: "/orders?status=ready",
          linkLabel: t("ready.link"),
          tone: "warning",
        };
      case "waitlist":
        return {
          icon: Users,
          title: t("waitlist.title"),
          description: `${t("waitlist.description", {
            count: alert.count,
            guests: alert.guests ?? 0,
          })}${alert.truncated ? ` ${t("waitlist.truncated")}` : ""}`,
          href: canOpenQueue ? "/queue" : null,
          linkLabel: t("waitlist.link"),
          tone: "info",
        };
      case "occupied-tables":
        return {
          icon: TableProperties,
          title: t("occupied.title"),
          description: t("occupied.description", { count: alert.count }),
          href: canOpenTables ? "/tables" : null,
          linkLabel: t("occupied.link"),
          tone: "info",
        };
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">{t("title")}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
        </div>
        <BellRing className="size-4 text-ink-subtle" aria-hidden="true" />
      </div>

      {alerts.length === 0 ? (
        <EmptyState
          bordered={false}
          compact
          icon={BellRing}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          className="mt-3"
        />
      ) : (
        <ul className="mt-4 space-y-3">
          {alerts.map((alert) => {
            const content = contentFor(alert);
            const Icon = content.icon;

            return (
              <li key={alert.kind} className="rounded-lg border border-line bg-surface-subtle p-3">
                <div className="flex items-start gap-2.5">
                  <span
                    className={[
                      "flex size-8 shrink-0 items-center justify-center rounded-lg",
                      content.tone === "warning"
                        ? "bg-warning-soft text-warning"
                        : "bg-info-soft text-info",
                    ].join(" ")}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-ink">{content.title}</p>
                      <Badge variant={content.tone === "warning" ? "warning" : "info"}>
                        {format.number(alert.count)}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                      {content.description}
                    </p>
                    {content.href ? (
                      <Link
                        href={content.href}
                        className="mt-1.5 inline-block text-xs font-medium text-brand hover:text-brand-strong"
                      >
                        {content.linkLabel}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
