import type { StaffRole } from "@/types/roles";

/**
 * UI capability hints only. The M5.2 queue RPC authorizes every read against
 * the authenticated staff profile and branch role. These helpers must never be
 * treated as the security boundary.
 */
export const QUEUE_VIEW_ROLES: readonly StaffRole[] = ["owner", "admin", "manager", "cashier"];

export const QUEUE_MANAGE_ROLES: readonly StaffRole[] = ["owner", "admin", "manager"];

function hasAnyRole(roles: readonly StaffRole[], allowed: readonly StaffRole[]): boolean {
  return roles.some((role) => allowed.includes(role));
}

/** Owner/Admin/Manager/Cashier may read; Kitchen Staff is denied. */
export function canViewQueue(roles: readonly StaffRole[]): boolean {
  return hasAnyRole(roles, QUEUE_VIEW_ROLES);
}

/** Management roles may operate the queue; Cashier is read-only. */
export function canManageQueue(roles: readonly StaffRole[]): boolean {
  return hasAnyRole(roles, QUEUE_MANAGE_ROLES);
}

/** Cashier-only viewers receive the read-only UX hint. */
export function isQueueReadOnly(roles: readonly StaffRole[]): boolean {
  return canViewQueue(roles) && !canManageQueue(roles);
}
