"use client";

import { CirclePlus, Power, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { ActionError, ActionSuccess } from "@/features/pos/components/action-feedback";

import {
  addKitchenCategoryRouteAction,
  addKitchenItemRouteAction,
  reactivateKitchenStationAction,
  removeKitchenCategoryRouteAction,
  removeKitchenItemRouteAction,
} from "../actions";
import { canAddKitchenRoute, canRemoveKitchenRoute } from "../access";
import type { KitchenMenuCatalog, KitchenStation } from "../contracts";
import type { StaffRole } from "@/types/roles";
import { useKitchenErrorMessage } from "../use-kitchen-error-message";
import { DeactivateStationDialog } from "./deactivate-station-dialog";
import { StationFormDialog } from "./station-form-dialog";

export function KitchenStationCard({
  station,
  catalog,
  roles,
  onUpdated,
}: {
  station: KitchenStation;
  catalog: KitchenMenuCatalog;
  roles: readonly StaffRole[];
  onUpdated: (station: KitchenStation) => void;
}) {
  const t = useTranslations("kitchen.stations");
  const router = useRouter();
  const errorMessage = useKitchenErrorMessage();
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const pendingRef = useRef(false);

  const canAddRoute = canAddKitchenRoute(roles, station.status);
  const canRemoveRoute = canRemoveKitchenRoute(roles);
  const busy = pendingKey !== null;

  const itemsByCategory = useMemo(() => {
    const groups = new Map<string, Array<{ id: string; name: string }>>();
    for (const item of catalog.items) {
      const group = groups.get(item.categoryId) ?? [];
      group.push({ id: item.id, name: item.name });
      groups.set(item.categoryId, group);
    }
    return groups;
  }, [catalog.items]);

  async function runMutation(
    key: string,
    call: () => Promise<Awaited<ReturnType<typeof reactivateKitchenStationAction>>>,
    successMessage: string,
  ) {
    if (pendingRef.current) {
      return;
    }

    pendingRef.current = true;
    setPendingKey(key);
    setError(null);
    setSuccess(null);

    try {
      const result = await call();
      if (!result.ok) {
        setError(errorMessage(result.error));
        if (result.committed) {
          router.refresh();
        }
        return;
      }

      onUpdated(result.data);
      setSuccess(successMessage);
    } finally {
      pendingRef.current = false;
      setPendingKey(null);
    }
  }

  function handleAddCategoryRoute() {
    if (!selectedCategoryId) {
      return;
    }

    const categoryName =
      catalog.categories.find((category) => category.id === selectedCategoryId)?.name ?? "";

    void runMutation(
      "add-category",
      () =>
        addKitchenCategoryRouteAction({
          stationId: station.stationId,
          menuCategoryId: selectedCategoryId,
        }),
      t("routeAdded", { name: categoryName }),
    ).then(() => setSelectedCategoryId(""));
  }

  function handleAddItemRoute() {
    if (!selectedItemId) {
      return;
    }

    const itemName = catalog.items.find((item) => item.id === selectedItemId)?.name ?? "";

    void runMutation(
      "add-item",
      () =>
        addKitchenItemRouteAction({
          stationId: station.stationId,
          menuItemId: selectedItemId,
        }),
      t("routeAdded", { name: itemName }),
    ).then(() => setSelectedItemId(""));
  }

  function handleReactivate() {
    void runMutation(
      "reactivate",
      () => reactivateKitchenStationAction({ stationId: station.stationId }),
      t("reactivateSuccess", { name: station.name }),
    );
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold tracking-tight text-ink">
              {station.name}
            </h2>
            <Badge variant={station.status === "active" ? "success" : "neutral"}>
              {station.status === "active" ? t("statusActive") : t("statusInactive")}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-ink-muted">{station.description || t("noDescription")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StationFormDialog
            mode="edit"
            branchId={station.branchId}
            station={station}
            onSaved={onUpdated}
          />
          {station.status === "active" ? (
            <DeactivateStationDialog station={station} onDeactivated={onUpdated} />
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReactivate}
              isLoading={pendingKey === "reactivate"}
              disabled={busy}
            >
              <Power />
              {t("reactivate")}
            </Button>
          )}
        </div>
      </div>

      {error ? <ActionError message={error} /> : null}
      {success ? <ActionSuccess message={success} /> : null}

      {station.status === "inactive" ? (
        <p className="rounded-lg border border-warning/20 bg-warning-soft/50 px-3 py-2 text-sm text-warning">
          {t("inactiveRouteNote")}
        </p>
      ) : null}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-ink">{t("categoryRoutes")}</h3>
        {station.categoryRoutes.length === 0 ? (
          <p className="text-sm text-ink-subtle">{t("noCategoryRoutes")}</p>
        ) : (
          <ul className="space-y-1.5">
            {station.categoryRoutes.map((route) => (
              <li
                key={route.routeId}
                className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-1.5"
              >
                <span className="truncate text-sm text-ink">{route.menuCategoryName}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    void runMutation(
                      `remove-category-${route.routeId}`,
                      () =>
                        removeKitchenCategoryRouteAction({
                          stationId: station.stationId,
                          menuCategoryId: route.menuCategoryId,
                        }),
                      t("routeRemoved", { name: route.menuCategoryName }),
                    );
                  }}
                  isLoading={pendingKey === `remove-category-${route.routeId}`}
                  disabled={!canRemoveRoute || busy}
                  aria-label={t("removeRouteLabel", { name: route.menuCategoryName })}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-1">
            <label
              htmlFor={`category-route-${station.stationId}`}
              className="text-xs font-medium text-ink-muted"
            >
              {t("addCategoryRoute")}
            </label>
            <Select
              id={`category-route-${station.stationId}`}
              value={selectedCategoryId}
              onChange={(event) => setSelectedCategoryId(event.target.value)}
              disabled={!canAddRoute || busy}
            >
              <option value="">{t("chooseCategory")}</option>
              {catalog.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
          <Button
            variant="secondary"
            onClick={handleAddCategoryRoute}
            disabled={!canAddRoute || !selectedCategoryId || busy}
            isLoading={pendingKey === "add-category"}
          >
            <CirclePlus />
            {t("add")}
          </Button>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-ink">{t("itemRoutes")}</h3>
        <p className="text-xs text-ink-subtle">{t("itemRoutePrecedence")}</p>
        {station.itemRoutes.length === 0 ? (
          <p className="text-sm text-ink-subtle">{t("noItemRoutes")}</p>
        ) : (
          <ul className="space-y-1.5">
            {station.itemRoutes.map((route) => (
              <li
                key={route.routeId}
                className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-1.5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ink">{route.menuItemName}</span>
                  <span className="block truncate text-xs text-ink-subtle">
                    {route.menuCategoryName}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    void runMutation(
                      `remove-item-${route.routeId}`,
                      () =>
                        removeKitchenItemRouteAction({
                          stationId: station.stationId,
                          menuItemId: route.menuItemId,
                        }),
                      t("routeRemoved", { name: route.menuItemName }),
                    );
                  }}
                  isLoading={pendingKey === `remove-item-${route.routeId}`}
                  disabled={!canRemoveRoute || busy}
                  aria-label={t("removeRouteLabel", { name: route.menuItemName })}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-1">
            <label
              htmlFor={`item-route-${station.stationId}`}
              className="text-xs font-medium text-ink-muted"
            >
              {t("addItemRoute")}
            </label>
            <Select
              id={`item-route-${station.stationId}`}
              value={selectedItemId}
              onChange={(event) => setSelectedItemId(event.target.value)}
              disabled={!canAddRoute || busy}
            >
              <option value="">{t("chooseItem")}</option>
              {catalog.categories.map((category) => {
                const items = itemsByCategory.get(category.id) ?? [];
                if (items.length === 0) {
                  return null;
                }
                return (
                  <optgroup key={category.id} label={category.name}>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </Select>
          </div>
          <Button
            variant="secondary"
            onClick={handleAddItemRoute}
            disabled={!canAddRoute || !selectedItemId || busy}
            isLoading={pendingKey === "add-item"}
          >
            <CirclePlus />
            {t("add")}
          </Button>
        </div>
      </section>
    </Card>
  );
}
