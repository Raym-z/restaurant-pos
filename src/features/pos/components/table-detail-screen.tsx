"use client";

import { Clock, DoorOpen, Receipt, TableProperties, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { PageHeader, PageSection, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useWorkspace } from "@/providers/workspace-provider";

import { canOperateFloor } from "../access";
import { resolveBranchContext } from "../branch-context";
import type { OrderSummary } from "../contracts";
import type { PosViewer, TableDetailData } from "../types";
import { CloseSessionDialog } from "./close-session-dialog";
import { CreateOrderDialog } from "./create-order-dialog";
import { OpenSessionDialog } from "./open-session-dialog";
import { OrderStatusBadge, TableAvailabilityBadge } from "./pos-status-badges";

export function TableDetailScreen({ data, viewer }: { data: TableDetailData; viewer: PosViewer }) {
  const t = useTranslations("tables.detail");
  const tSession = useTranslations("tables.session");
  const tOrder = useTranslations("tables.order");
  const format = useLocalizedFormat();
  const router = useRouter();
  const { branches, organization } = useWorkspace();
  const [isRefreshing, startRefresh] = useTransition();
  const { table, activeSession, menu } = data;
  const canOperate = canOperateFloor(viewer.roles);
  const branchContext = resolveBranchContext({
    branches,
    branchId: table.branchId,
    fallbackName: activeSession?.branchName ?? t("unknownBranch"),
    fallbackTimezone: organization.timezone,
  });
  const branchName = branchContext.name || t("unknownBranch");
  const branchTimezone = branchContext.timezone;
  const currency = organization.currency;

  const headerActions = (
    <>
      <Button
        variant="secondary"
        onClick={() => startRefresh(() => router.refresh())}
        isLoading={isRefreshing}
      >
        {t("refresh")}
      </Button>
      {!activeSession && table.availability === "available" && canOperate ? (
        <OpenSessionDialog tableId={table.tableId} tableLabel={table.label} />
      ) : null}
    </>
  );

  return (
    <PageStack>
      <PageHeader
        title={table.label}
        description={t("description", { branch: branchName })}
        eyebrow={t("eyebrow")}
        backLink={{ href: "/tables", label: t("back") }}
        actions={headerActions}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <CardTitle>{t("tableInformation")}</CardTitle>
            <TableAvailabilityBadge availability={table.availability} />
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-ink-muted">
                <TableProperties className="size-4" aria-hidden="true" />
                {t("status")}
              </span>
              <Badge variant={table.status === "active" ? "success" : "neutral"}>
                {t(`tableStatus.${table.status}`)}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-ink-muted">
                <Users className="size-4" aria-hidden="true" />
                {t("capacity")}
              </span>
              <span className="font-medium text-ink">{t("seats", { count: table.capacity })}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-ink-muted">
                <Clock className="size-4" aria-hidden="true" />
                {t("branch")}
              </span>
              <span className="text-right font-medium text-ink">{branchName}</span>
            </div>
            {table.qrPublicId ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-muted">{t("qr")}</span>
                <Badge variant="outline">{t("qrLinked")}</Badge>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <CardTitle>{tSession("title")}</CardTitle>
            {activeSession ? <Badge variant="success">{tSession("active")}</Badge> : null}
          </CardHeader>
          <CardContent>
            {activeSession ? (
              <div className="space-y-4">
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-ink-muted">{tSession("openedAt")}</dt>
                    <dd className="mt-0.5 font-medium text-ink">
                      {format.dateTime(activeSession.openedAt, branchTimezone)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">{tSession("orders")}</dt>
                    <dd className="mt-0.5 font-medium text-ink">
                      {tSession("orderCounts", {
                        total: activeSession.orderCount,
                        active: activeSession.activeOrderCount,
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">{tSession("subtotal")}</dt>
                    <dd className="mt-0.5 font-medium text-ink">
                      {format.currencyAmount(activeSession.subtotalMinor, activeSession.currency)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">{tSession("status")}</dt>
                    <dd className="mt-0.5">
                      <Badge variant="success">{tSession("active")}</Badge>
                    </dd>
                  </div>
                </dl>

                {activeSession.activeOrderCount > 0 ? (
                  <p className="rounded-lg border border-warning/20 bg-warning-soft/40 px-3 py-2 text-sm text-warning">
                    {tSession("outstandingNotice", { count: activeSession.activeOrderCount })}
                  </p>
                ) : (
                  <p className="text-sm text-ink-muted">{tSession("closeReady")}</p>
                )}

                {canOperate && menu ? (
                  <div className="flex flex-wrap gap-2">
                    <CreateOrderDialog
                      diningSessionId={activeSession.sessionId}
                      tableLabel={table.label}
                      menu={menu}
                    />
                    <CloseSessionDialog
                      sessionId={activeSession.sessionId}
                      tableLabel={table.label}
                      activeOrderCount={activeSession.activeOrderCount}
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyState
                bordered={false}
                compact
                icon={DoorOpen}
                title={tSession("emptyTitle")}
                description={
                  table.availability === "inactive"
                    ? tSession("inactiveDescription")
                    : tSession("emptyDescription")
                }
                action={
                  table.availability === "available" && canOperate ? (
                    <OpenSessionDialog tableId={table.tableId} tableLabel={table.label} />
                  ) : null
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      <PageSection
        title={tOrder("sessionOrdersTitle")}
        description={tOrder("sessionOrdersDescription")}
      >
        <Card className="overflow-hidden">
          {activeSession && activeSession.orders.length > 0 ? (
            <ul className="divide-y divide-line">
              {activeSession.orders.map((order) => (
                <SessionOrderRow
                  key={order.orderId}
                  order={order}
                  currency={currency}
                  timezone={branchTimezone}
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              bordered={false}
              compact
              icon={Receipt}
              title={activeSession ? tOrder("sessionEmptyTitle") : tOrder("noSessionTitle")}
              description={
                activeSession ? tOrder("sessionEmptyDescription") : tOrder("noSessionDescription")
              }
            />
          )}
        </Card>
      </PageSection>

      {!canOperate ? <p className="text-sm text-ink-muted">{t("restrictedNotice")}</p> : null}
    </PageStack>
  );
}

function SessionOrderRow({
  order,
  currency,
  timezone,
}: {
  order: OrderSummary;
  currency: string;
  timezone: string;
}) {
  const format = useLocalizedFormat();
  const t = useTranslations("tables.order");

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/orders/${order.orderId}`} className="font-medium text-ink hover:text-brand">
            {order.orderReference}
          </Link>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-xs text-ink-subtle">
          {format.dateTime(order.createdAt, timezone)} ·{" "}
          {t("itemCount", { count: order.activeItemCount })}
        </p>
      </div>
      <div className="flex items-center gap-3 sm:text-right">
        <div>
          <p className="text-sm font-semibold text-ink">
            {format.currencyAmount(order.payableSubtotalMinor, order.currency || currency)}
          </p>
          <p className="text-xs text-ink-subtle">{t("payableSubtotal")}</p>
          {order.status === "cancelled" ? (
            <p className="text-xs text-ink-subtle">
              {t("historicalSubtotal", {
                amount: format.currencyAmount(order.subtotalMinor, order.currency || currency),
              })}
            </p>
          ) : null}
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/orders/${order.orderId}`}>{t("viewOrder")}</Link>
        </Button>
      </div>
      <Separator className="sm:hidden" />
    </li>
  );
}
