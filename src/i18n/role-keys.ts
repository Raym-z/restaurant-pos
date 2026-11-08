import type { StaffRole } from "@/types/roles";

/**
 * Display-label translation keys for canonical role identifiers.
 *
 * Legacy identifiers are intentionally absent. Unknown values fall back to the
 * raw identifier rather than being silently mapped to another role.
 */
export const ROLE_TRANSLATION_KEYS: Record<StaffRole, string> = {
  owner: "owner",
  admin: "admin",
  manager: "manager",
  cashier: "cashier",
  kitchen_staff: "kitchenStaff",
};

export function roleTranslationKey(role: string): string | null {
  return (ROLE_TRANSLATION_KEYS as Record<string, string>)[role] ?? null;
}
