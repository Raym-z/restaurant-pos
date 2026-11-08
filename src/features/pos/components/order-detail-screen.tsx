"use client";

import { ArrowRight, Minus, Plus, Receipt, RefreshCw, TableProperties } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { PageHeader, PageSection, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useWorkspace } from "@/providers/workspace-provider";

import {
  canCancelOrder,
  canCancelStatus,
  canModifyOrderItems,
  canOperateFloor,
  canTransitionOrder,
} from "../access";
import { resolveBranchContext } from "../branch-context";
import {
  TRANSITION_TARGET_STATUSES,
  nextOrderStatusesForItems,
  type OrderItem,
  type OrderStatus,
  type TransitionTargetStatus,
} from "../contracts";
import { updateOrderItemQuantityAction, transitionOrderStatusAction } from "../actions";
import type { OrderDetailData, PosViewer } from "../types";
import { usePosErrorMessage } from "../use-pos-error-message";
import { ActionError, ActionSuccess } from "./action-feedback";
import { AddOrderItemDialog } from "./add-order-item-dialog";
import { CancelOrderDialog } from "./cancel-order-dialog";
import { OrderItemStatusBadge, OrderStatusBadge } from "./pos-status-badges";
import { RemoveOrderItemDialog } from "./remove-order-item-dialog";

const TRANSITION_ACTION_KEYS: Record<TransitionTargetStatus, string> = {
  accepted: "accept",
  preparing: "startPreparing",
  ready: "markReady",
  served: "markServed",
  completed: "complete",
};

function isTransitionTarget(status: OrderStatus): status is TransitionTargetStatus {
  return (TRANSITION_TARGET_STATUSES as readonly string[]).includes(status);
}

export function OrderDetailScreen({ data, viewer }: { data: OrderDetailData; viewer: PosViewer }) {
  const t = useTranslations("orders.detail");
  const tTransitions = useTranslations("orders.transitions");
  const router = useRouter();
  const { branches, organization } = useWorkspace();
  const format = useLocalizedFormat();
  const errorMessage = usePosErrorMessage();
  const { order, session, menu, menuError } = data;
  const branchContext = resolveBranchContext({
    branches,
    branchId: order.branchId,
    fallbackName: session?.branchName ?? organization.name,
    fallbackTimezone: organization.timezone,
  });
  const orderTimezone = branchContext.timezone;
  const branchName = branchContext.name || organization.name;
  const menuErrorMessage = menuError ? errorMessage(menuError) : null;
  const [isRefreshing, startRefresh] = useTransition();
  const [isTransitioning, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const sessionActive = session?.status === "active";
  const canOperate = canOperateFloor(viewer.roles);
  const itemsEditable = canOperate && sessionActive && canModifyOrderItems(order.status);
  const showCancel =
    canOperate && sessionActive && canCancelStatus(order.status) && canCancelOrder(viewer.roles);
  const transitionTargets = nextOrderStatusesForItems(order.status, order.activeItemCount).filter(
    isTransitionTarget,
  );
  const isTerminal = order.status === "completed" || order.status === "cancelled";
  const allowedTransitions = sessionActive
    ? transitionTargets.filter((target) => canTransitionOrder(viewer.roles, target))
    : [];

  function handleTransition(target: TransitionTargetStatus) {
    setActionError(null);
    setActionSuccess(null);
    startTransition(async () => {
      const result = await transitionOrderStatusAction(order.orderId, target);
      if (!result.ok) {
        setActionError(errorMessage(result.error));
        if (result.committed) {
          router.refresh();
        }
        return;
      }

      setActionSuccess(tTransitions("success", { status: tTransitions(target) }));
      router.refresh();
    });
  }

  return (
    <PageStack>
      <PageHeader
        title={order.orderReference}
        description={t("description", {
          table: session?.tableLabel ?? t("unknownTable"),
          branch: branchName,
        })}
        eyebrow={t("eyebrow")}
        backLink={{ href: "/orders", label: t("back") }}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => startRefresh(() => router.refresh())}
              isLoading={isRefreshing}
            >
              <RefreshCw />
              {t("refresh")}
            </Button>
            {allowedTransitions.map((target) => (
              <Button
                key={target}
                onClick={() => handleTransition(target)}
                isLoading={isTransitioning}
              >
                <ArrowRight />
                {tTransitions(TRANSITION_ACTION_KEYS[target])}
              </Button>
            ))}
            {showCancel ? (
              <CancelOrderDialog orderId={order.orderId} orderReference={order.orderReference} />
            ) : null}
          </>
        }
      />

      <ActionError message={actionError} />
      <ActionSuccess message={actionSuccess} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <CardTitle>{t("summary")}</CardTitle>
            <OrderStatusBadge status={order.status} />
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-ink-muted">{t("table")}</dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {session ? (
                    <Link
                      href={`/tables/${session.tableId}`}
                      className="inline-flex items-center gap-1.5 hover:text-brand"
                    >
                      <TableProperties className="size-3.5" aria-hidden="true" />
                      {session.tableLabel}
                    </Link>
                  ) : (
                    t("unknownTable")
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">{t("source")}</dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {order.source === "guest" ? t("sourceGuest") : t("sourceStaff")}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">{t("created")}</dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {format.dateTime(order.createdAt, orderTimezone)}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">{t("items")}</dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {t("itemCount", { count: order.activeItemCount })}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">{t("session")}</dt>
                <dd className="mt-0.5">
                  {session ? (
                    <Badge variant={sessionActive ? "success" : "neutral"}>
                      {sessionActive ? t("sessionActive") : t("sessionClosed")}
                    </Badge>
                  ) : (
                    <Badge variant="neutral">{t("sessionUnavailable")}</Badge>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">{t("payableSubtotal")}</dt>
                <dd className="mt-0.5 text-base font-semibold text-ink">
                  {format.currencyAmount(order.payableSubtotalMinor, order.currency)}
                </dd>
                {order.status === "cancelled" ? (
                  <dd className="mt-1 text-xs text-ink-subtle">
                    {t("historicalSubtotal", {
                      amount: format.currencyAmount(order.subtotalMinor, order.currency),
                    })}
                  </dd>
                ) : null}
              </div>
            </dl>

            {order.status === "completed" ? (
              <p className="rounded-lg border border-info/20 bg-info-soft/40 px-3 py-2 text-sm text-info">
                {t("completedNotSettled")}
              </p>
            ) : null}

            {order.notes ? (
              <div className="rounded-lg border border-line bg-surface-subtle px-3 py-2">
                <p className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                  {t("notes")}
                </p>
                <p className="mt-1 text-sm text-ink">{order.notes}</p>
              </div>
            ) : null}

            {order.status === "cancelled" ? (
              <div className="rounded-lg border border-danger/20 bg-danger-soft/40 px-3 py-2">
                <p className="text-sm font-medium text-danger">{t("cancelledTitle")}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {order.cancellationReason ?? t("cancelledNoReason")}
                </p>
                {order.cancelledAt ? (
                  <p className="mt-1 text-xs text-ink-subtle">
                    {format.dateTime(order.cancelledAt, orderTimezone)}
                  </p>
                ) : null}
              </div>
            ) : null}

            {!sessionActive ? (
              <p className="rounded-lg border border-warning/20 bg-warning-soft/40 px-3 py-2 text-sm text-warning">
                {t("sessionInactiveNotice")}
              </p>
            ) : null}

            {sessionActive &&
            !isTerminal &&
            allowedTransitions.length === 0 &&
            showCancel === false ? (
              <p className="text-sm text-ink-muted">{t("roleRestricted")}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("timeline")}</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline
              order={order}
              timezone={orderTimezone}
              formatDateTime={format.dateTime}
            />
          </CardContent>
        </Card>
      </div>

      <PageSection
        title={t("itemsTitle")}
        description={t("itemsDescription")}
        actions={
          itemsEditable && menu && !menuError ? (
            <AddOrderItemDialog
              orderId={order.orderId}
              orderReference={order.orderReference}
              menu={menu}
            />
          ) : null
        }
      >
        <ActionError message={menuErrorMessage} />
        <Card className="overflow-hidden">
          {order.items.length === 0 ? (
            <EmptyState
              bordered={false}
              compact
              icon={Receipt}
              title={t("emptyItemsTitle")}
              description={t("emptyItemsDescription")}
            />
          ) : (
            <TableContainer>
              <Table aria-label={t("itemsTitle")}>
                <TableCaption className="sr-only">{t("itemsTitle")}</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("item")}</TableHead>
                    <TableHead className="text-right">{t("quantity")}</TableHead>
                    <TableHead className="text-right">{t("unitPrice")}</TableHead>
                    <TableHead className="text-right">{t("lineTotal")}</TableHead>
                    <TableHead>{t("itemStatus")}</TableHead>
                    <TableHead>
                      <span className="sr-only">{t("itemActions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <OrderItemRow
                      key={item.orderItemId}
                      item={item}
                      canEdit={itemsEditable}
                      timezone={orderTimezone}
                    />
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3}>{t("payableSubtotal")}</TableCell>
                    <TableCell className="text-right text-base font-semibold text-ink">
                      {format.currencyAmount(order.payableSubtotalMinor, order.currency)}
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
          )}
        </Card>
      </PageSection>
    </PageStack>
  );
}

function OrderTimeline({
  order,
  timezone,
  formatDateTime,
}: {
  order: OrderDetailData["order"];
  timezone: string;
  formatDateTime: (value: string, timeZone?: string) => string;
}) {
  const t = useTranslations("orders.detail.timelineLabels");
  const entries: Array<{ key: string; label: string; value: string | null }> = [
    { key: "created", label: t("created"), value: order.createdAt },
    { key: "accepted", label: t("accepted"), value: order.acceptedAt },
    { key: "preparing", label: t("preparing"), value: order.preparingAt },
    { key: "ready", label: t("ready"), value: order.readyAt },
    { key: "served", label: t("served"), value: order.servedAt },
    { key: "completed", label: t("completed"), value: order.completedAt },
    { key: "cancelled", label: t("cancelled"), value: order.cancelledAt },
  ];

  return (
    <ol className="space-y-2">
      {entries.map((entry) => (
        <li key={entry.key} className="flex items-center justify-between gap-3 text-sm">
          <span className="text-ink-muted">{entry.label}</span>
          <span className={entry.value ? "font-medium text-ink" : "text-ink-subtle"}>
            {entry.value ? formatDateTime(entry.value, timezone) : "—"}
          </span>
        </li>
      ))}
    </ol>
  );
}

function OrderItemRow({
  item,
  canEdit,
  timezone,
}: {
  item: OrderItem;
  canEdit: boolean;
  timezone: string;
}) {
  const t = useTranslations("orders.items");
  const router = useRouter();
  const format = useLocalizedFormat();
  const errorMessage = usePosErrorMessage();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const editable = canEdit && item.status !== "cancelled";

  function changeQuantity(quantity: number) {
    if (quantity < 1 || quantity > 99) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateOrderItemQuantityAction(item.orderItemId, quantity);
      if (!result.ok) {
        setError(errorMessage(result.error));
        return;
      }

      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell className="min-w-[220px]">
        <p className="font-medium text-ink">{item.name}</p>
        {item.modifiers.length > 0 ? (
          <p className="mt-0.5 text-xs text-ink-subtle">
            {item.modifiers.map((modifier) => modifier.optionName).join(" · ")}
          </p>
        ) : null}
        {item.notes ? <p className="mt-0.5 text-xs text-ink-subtle">{item.notes}</p> : null}
        {item.cancelledAt ? (
          <p className="mt-1 text-xs text-ink-subtle">
            {t("cancelledAt", { date: format.dateTime(item.cancelledAt, timezone) })}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-1 text-xs text-danger">
            {error}
          </p>
        ) : null}
      </TableCell>
      <TableCell className="text-right">
        {editable ? (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="secondary"
              size="icon-sm"
              onClick={() => changeQuantity(item.quantity - 1)}
              disabled={item.quantity <= 1 || isPending}
              aria-label={t("decreaseQuantity")}
            >
              <Minus />
            </Button>
            <span className="w-8 text-center font-medium text-ink">{item.quantity}</span>
            <Button
              variant="secondary"
              size="icon-sm"
              onClick={() => changeQuantity(item.quantity + 1)}
              disabled={item.quantity >= 99 || isPending}
              aria-label={t("increaseQuantity")}
            >
              <Plus />
            </Button>
          </div>
        ) : (
          <span className="font-medium text-ink">{item.quantity}</span>
        )}
      </TableCell>
      <TableCell className="text-right text-ink-muted">
        {format.currencyAmount(item.effectiveUnitPriceMinor, item.currency)}
      </TableCell>
      <TableCell className="text-right font-medium text-ink">
        {format.currencyAmount(item.lineTotalMinor, item.currency)}
      </TableCell>
      <TableCell>
        <OrderItemStatusBadge status={item.status} />
      </TableCell>
      <TableCell className="text-right">
        {editable ? (
          <RemoveOrderItemDialog orderItemId={item.orderItemId} itemName={item.name} />
        ) : null}
      </TableCell>
    </TableRow>
  );
}
