import type { StaffRole } from "@/types/roles";

import type { OrderStatus, TransitionTargetStatus } from "./contracts";

/**
 * UI capability hints only. The M3 backend RPCs authorize every operation
 * against the authenticated staff profile, branch access, and branch role.
 * These helpers must never be treated as the security boundary.
 */
export const FLOOR_ROLES: readonly StaffRole[] = ["owner", "admin", "manager", "cashier"];
export const KITCHEN_ROLES: readonly StaffRole[] = ["owner", "admin", "manager", "kitchen_staff"];

function hasAnyRole(roles: readonly StaffRole[], allowed: readonly StaffRole[]): boolean {
  return roles.some((role) => allowed.includes(role));
}

/** Open/close dining sessions and create or edit orders. */
export function canOperateFloor(roles: readonly StaffRole[]): boolean {
  return hasAnyRole(roles, FLOOR_ROLES);
}

/** Add/remove/update order items and cancel orders. */
export function canModifyOrders(roles: readonly StaffRole[]): boolean {
  return hasAnyRole(roles, FLOOR_ROLES);
}

/** Apply an order status transition, per the M3 authorization matrix. */
export function canTransitionOrder(
  roles: readonly StaffRole[],
  target: TransitionTargetStatus,
): boolean {
  if (target === "accepted" || target === "served" || target === "completed") {
    return hasAnyRole(roles, FLOOR_ROLES);
  }

  return hasAnyRole(roles, KITCHEN_ROLES);
}

/** Cancellation is a separate RPC and requires a floor role and a reason. */
export function canCancelOrder(roles: readonly StaffRole[]): boolean {
  return hasAnyRole(roles, FLOOR_ROLES);
}

/**
 * Mirrors the backend rule that cancellation is allowed only before service.
 * The backend still rejects invalid statuses.
 */
export function canCancelStatus(status: OrderStatus): boolean {
  return (
    status === "pending" || status === "accepted" || status === "preparing" || status === "ready"
  );
}

/** Order items are mutable only while the order is pending or accepted. */
export function canModifyOrderItems(status: OrderStatus): boolean {
  return status === "pending" || status === "accepted";
}
