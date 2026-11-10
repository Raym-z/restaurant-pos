"use client";

import { RefreshCw, ShoppingCart, TableProperties, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { PageHeader, PageSection, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useWorkspace } from "@/providers/workspace-provider";

import { createOrderAction } from "../actions";
import { canOperateFloor } from "../access";
import {
  EMPTY_CART,
  addLineToCart,
  cartItemCount,
  clearCart,
  orderSignature,
  removeLineFromCart,
  toCreateOrderItems,
  updateLineQuantity,
  type PosCartState,
} from "../cart";
import type { OrderDetail, TableSummary } from "../contracts";
import {
  EMPTY_IDEMPOTENCY_STATE,
  resolveIdempotencyKey,
  type IdempotencyKeyState,
} from "../idempotency";
import type { PosMenu, PosViewer, TableOverviewData, TableSessionData } from "../types";
import { usePosErrorMessage } from "../use-pos-error-message";
import { PosCartPanel } from "./pos-cart-panel";
import { PosChangeTableDialog } from "./pos-change-table-dialog";
import { PosOpenSessionPanel } from "./pos-open-session-panel";
import { PosOrderConfirmation } from "./pos-order-confirmation";
import { PosSessionOrders } from "./pos-session-orders";
import { PosSessionSummary } from "./pos-session-summary";
import { PosTableSelection } from "./pos-table-selection";
import { MenuItemPicker } from "./menu-item-picker";

const STALE_DATA_ERRORS = new Set([
  "MENU_ITEM_UNAVAILABLE",
  "MENU_ITEM_NOT_FOUND",
  "SESSION_NOT_ACTIVE",
  "DINING_SESSION_NOT_FOUND",
  "RESOURCE_CONFLICT",
]);

export function PosOrderingScreen({
  viewer,
  tables,
  menu,
  selection,
}: {
  viewer: PosViewer;
  tables: TableOverviewData;
  menu: PosMenu;
  selection: TableSessionData | null;
}) {
  const t = useTranslations("pos.ordering");
  const router = useRouter();
  const errorMessage = usePosErrorMessage();
  const { activeBranch } = useWorkspace();
  const [cart, setCart] = useState<PosCartState>(EMPTY_CART);
  const [orderNotes, setOrderNotes] = useState("");
  const [lastOrder, setLastOrder] = useState<OrderDetail | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();
  const [isPending, startSubmit] = useTransition();
  const idempotency = useRef<IdempotencyKeyState>(EMPTY_IDEMPOTENCY_STATE);

  const canOperate = canOperateFloor(viewer.roles);
  const activeSession = selection?.activeSession ?? null;
  const selectedTable = selection?.table ?? null;
  const sessionId = activeSession?.sessionId ?? null;
  const cartIsolation = cart.lines.length > 0 && cart.sessionId !== sessionId;
  const menuEmpty = menu.itemCount === 0;

  function goToTable(table: TableSummary) {
    router.push(`/pos?table=${table.tableId}`);
  }

  function changeTable(table: TableSummary) {
    // Never attach the previous cart to another table or session.
    setCart(clearCart());
    setOrderNotes("");
    setLastOrder(null);
    setSubmitError(null);
    setUncertain(false);
    setMobileCartOpen(false);
    idempotency.current = EMPTY_IDEMPOTENCY_STATE;
    router.push(`/pos?table=${table.tableId}`);
  }

  function resetDraft() {
    setCart(clearCart());
    setOrderNotes("");
    setSubmitError(null);
    setUncertain(false);
    idempotency.current = EMPTY_IDEMPOTENCY_STATE;
  }

  function handleAddLine(line: Parameters<typeof addLineToCart>[2]) {
    if (!sessionId || cartIsolation || uncertain) {
      return;
    }

    setCart((current) => addLineToCart(current, sessionId, line));
    setLastOrder(null);
    setSubmitError(null);
    idempotency.current = EMPTY_IDEMPOTENCY_STATE;
  }

  function handleQuantityChange(key: string, quantity: number) {
    if (uncertain) {
      return;
    }
    setCart((current) => updateLineQuantity(current, key, quantity));
    setSubmitError(null);
    idempotency.current = EMPTY_IDEMPOTENCY_STATE;
  }

  function handleRemoveLine(key: string) {
    if (uncertain) {
      return;
    }
    setCart((current) => removeLineFromCart(current, key));
    setSubmitError(null);
    idempotency.current = EMPTY_IDEMPOTENCY_STATE;
  }

  function handleClearCart() {
    resetDraft();
  }

  function handleSubmit() {
    if (!sessionId || cart.lines.length === 0 || cartIsolation || isPending) {
      return;
    }

    const items = toCreateOrderItems(cart.lines);
    const signature = orderSignature(sessionId, items, orderNotes);
    const resolved = resolveIdempotencyKey(idempotency.current, signature);
    idempotency.current = resolved.state;
    setSubmitError(null);

    startSubmit(async () => {
      const result = await createOrderAction({
        diningSessionId: sessionId,
        items,
        notes: orderNotes.trim() || undefined,
        idempotencyKey: resolved.key,
      });

      if (!result.ok) {
        setSubmitError(errorMessage(result.error));

        if (result.error.code === "IDEMPOTENCY_CONFLICT") {
          // The backend says this key belongs to different content. A new key
          // is required before the current payload can be submitted.
          idempotency.current = EMPTY_IDEMPOTENCY_STATE;
          router.refresh();
          return;
        }

        if (result.committed) {
          setUncertain(true);
          router.refresh();
          return;
        }

        if (STALE_DATA_ERRORS.has(result.error.code)) {
          router.refresh();
        }
        return;
      }

      // Clear only after the backend confirmed the order.
      setCart(clearCart());
      setOrderNotes("");
      setLastOrder(result.data);
      setSubmitError(null);
      setUncertain(false);
      setMobileCartOpen(false);
      idempotency.current = EMPTY_IDEMPOTENCY_STATE;
      router.refresh();
    });
  }

  const headerActions = (
    <>
      <Button
        variant="secondary"
        onClick={() => startRefresh(() => router.refresh())}
        isLoading={isRefreshing}
      >
        <RefreshCw />
        {t("refresh")}
      </Button>
      {selectedTable ? (
        <PosChangeTableDialog
          tables={tables.tables}
          branchName={activeBranch.name}
          timezone={viewer.timezone}
          selectedTableId={selectedTable.tableId}
          currentTableLabel={selectedTable.label}
          hasCart={cart.lines.length > 0}
          onConfirm={changeTable}
        />
      ) : null}
    </>
  );

  return (
    <PageStack className="pb-24 xl:pb-0">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description", { branch: activeBranch.name })}
        actions={headerActions}
      />

      {!selectedTable || !selection ? (
        <PageSection title={t("selectTableTitle")} description={t("selectTableDescription")}>
          <PosTableSelection
            tables={tables.tables}
            branchName={activeBranch.name}
            timezone={viewer.timezone}
            onSelect={goToTable}
          />
        </PageSection>
      ) : !activeSession ? (
        <div className="space-y-6">
          {cartIsolation ? (
            <div className="flex flex-col gap-3 rounded-lg border border-warning/25 bg-warning-soft/50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
                <div>
                  <p className="font-medium text-ink">{t("cart.cartIsolationTitle")}</p>
                  <p className="mt-0.5 text-ink-muted">{t("cart.cartIsolationDescription")}</p>
                </div>
              </div>
              <Button variant="danger" size="sm" onClick={handleClearCart}>
                {t("cart.cartIsolationAction")}
              </Button>
            </div>
          ) : null}
          <PosOpenSessionPanel key={selectedTable.tableId} table={selectedTable} />
          <Card>
            <CardHeader>
              <CardTitle>{t("closedSession.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-ink-muted">{t("closedSession.description")}</p>
              <Button asChild variant="secondary" size="sm">
                <Link href="/orders">{t("closedSession.viewOrders")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <PosSessionSummary
            table={selectedTable}
            session={activeSession}
            timezone={viewer.timezone}
          />

          {cartIsolation ? (
            <div className="flex flex-col gap-3 rounded-lg border border-warning/25 bg-warning-soft/50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
                <div>
                  <p className="font-medium text-ink">{t("cart.cartIsolationTitle")}</p>
                  <p className="mt-0.5 text-ink-muted">{t("cart.cartIsolationDescription")}</p>
                </div>
              </div>
              <Button variant="danger" size="sm" onClick={handleClearCart}>
                {t("cart.cartIsolationAction")}
              </Button>
            </div>
          ) : null}

          {lastOrder ? (
            <PosOrderConfirmation
              order={lastOrder}
              tableLabel={selectedTable.label}
              onNewOrder={() => setLastOrder(null)}
            />
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
            <Card>
              <CardHeader>
                <CardTitle>{t("menu.title")}</CardTitle>
                <p className="text-sm text-ink-muted">{t("menu.description")}</p>
              </CardHeader>
              <CardContent>
                {menuEmpty ? (
                  <EmptyState
                    bordered={false}
                    compact
                    icon={TableProperties}
                    title={t("menu.emptyTitle")}
                    description={t("menu.emptyDescription")}
                    action={
                      <Button asChild variant="secondary" size="sm">
                        <Link href="/menu">{t("menu.manageMenu")}</Link>
                      </Button>
                    }
                  />
                ) : (
                  <MenuItemPicker
                    menu={menu}
                    submitLabel={t("cart.addToCart")}
                    onAdd={handleAddLine}
                    isSubmitting={isPending || uncertain || cartIsolation}
                  />
                )}
              </CardContent>
            </Card>

            <aside className="hidden xl:block">
              <div className="xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
                <PosCartPanel
                  cart={cart}
                  currency={viewer.currency}
                  orderNotes={orderNotes}
                  onOrderNotesChange={setOrderNotes}
                  onQuantityChange={handleQuantityChange}
                  onRemoveLine={handleRemoveLine}
                  onSubmit={handleSubmit}
                  onClear={handleClearCart}
                  isPending={isPending}
                  uncertain={uncertain}
                  blocked={cartIsolation}
                  actionError={submitError}
                />
              </div>
            </aside>
          </div>

          <PageSection title={t("orders.title")} description={t("orders.description")}>
            <PosSessionOrders orders={activeSession.orders} timezone={viewer.timezone} />
          </PageSection>

          <div className="sticky bottom-3 z-20 xl:hidden">
            <Dialog open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
              <DialogTrigger asChild>
                <Button className="w-full shadow-lg" size="lg">
                  <ShoppingCart />
                  {cart.lines.length > 0
                    ? t("mobileCart.action", { count: cartItemCount(cart) })
                    : t("mobileCart.empty")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t("cart.title")}</DialogTitle>
                </DialogHeader>
                <PosCartPanel
                  cart={cart}
                  currency={viewer.currency}
                  orderNotes={orderNotes}
                  onOrderNotesChange={setOrderNotes}
                  onQuantityChange={handleQuantityChange}
                  onRemoveLine={handleRemoveLine}
                  onSubmit={handleSubmit}
                  onClear={handleClearCart}
                  isPending={isPending}
                  uncertain={uncertain}
                  blocked={cartIsolation}
                  actionError={submitError}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      {!canOperate ? <p className="text-sm text-ink-muted">{t("restrictedNotice")}</p> : null}
    </PageStack>
  );
}
