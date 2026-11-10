import type { StaffRole } from "@/types/roles";
import { MANAGER_ROLES } from "@/types/roles";

import type { KitchenTicketItemStatus } from "./contracts";

/**
 * UI capability hints only. The M4 kitchen RPCs authorize every read and write
 * against the authenticated staff profile and branch role. These helpers must
 * never be treated as the security boundary.
 */
export const KITCHEN_ROLES: readonly StaffRole[] = ["owner", "admin", "manager", "kitchen_staff"];

export const KITCHEN_STATION_ADMIN_ROLES: readonly StaffRole[] = MANAGER_ROLES;

export type KitchenItemAction = "start" | "markReady" | "complete";

export interface KitchenItemActionDescriptor {
  action: KitchenItemAction;
  targetStatus: "preparing" | "ready" | "completed";
}

const ITEM_ACTIONS: Record<
  Exclude<KitchenTicketItemStatus, "completed" | "cancelled">,
  KitchenItemActionDescriptor
> = {
  pending: { action: "start", targetStatus: "preparing" },
  preparing: { action: "markReady", targetStatus: "ready" },
  ready: { action: "complete", targetStatus: "completed" },
};

function hasAnyRole(roles: readonly StaffRole[], allowed: readonly StaffRole[]): boolean {
  return roles.some((role) => allowed.includes(role));
}

/** Owner/Admin/Manager/Kitchen Staff may read the kitchen board and history. */
export function canViewKitchen(roles: readonly StaffRole[]): boolean {
  return hasAnyRole(roles, KITCHEN_ROLES);
}

/** Same branch-role rule as the M4.2 item-transition RPCs. */
export function canOperateKitchen(roles: readonly StaffRole[]): boolean {
  return hasAnyRole(roles, KITCHEN_ROLES);
}

/** Station configuration writes require Owner/Admin/Manager. */
export function canManageKitchenStations(roles: readonly StaffRole[]): boolean {
  return hasAnyRole(roles, KITCHEN_STATION_ADMIN_ROLES);
}

/** Routes may only be added to an active station. Removal remains available. */
export function canAddKitchenRoute(
  roles: readonly StaffRole[],
  stationStatus: "active" | "inactive",
): boolean {
  return canManageKitchenStations(roles) && stationStatus === "active";
}

/** Existing routes can be removed even while the station is inactive. */
export function canRemoveKitchenRoute(roles: readonly StaffRole[]): boolean {
  return canManageKitchenStations(roles);
}

/** Maps an item state to its single supported forward transition. */
export function kitchenItemActionFor(
  status: KitchenTicketItemStatus,
): KitchenItemActionDescriptor | null {
  if (status === "completed" || status === "cancelled") {
    return null;
  }

  return ITEM_ACTIONS[status];
}

export function canTransitionKitchenItem(
  roles: readonly StaffRole[],
  status: KitchenTicketItemStatus,
): boolean {
  return canOperateKitchen(roles) && kitchenItemActionFor(status) !== null;
}
