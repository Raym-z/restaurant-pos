"use client";

import { useTranslations } from "next-intl";

import { roleTranslationKey } from "./role-keys";

const STATUS_KEYS: Record<string, string> = {
  active: "active",
  inactive: "inactive",
  invited: "invited",
  suspended: "suspended",
  deactivated: "inactive",
  pending_deletion: "pendingDeletion",
  opening_soon: "openingSoon",
  available: "available",
  unavailable: "unavailable",
  archived: "archived",
  new: "new",
  preparing: "preparing",
  ready: "ready",
  completed: "completed",
  cancelled: "cancelled",
};

/** Display label for a role identifier. The identifier itself never changes. */
export function useRoleLabel() {
  const t = useTranslations("roles");
  return (role: string): string => {
    const key = roleTranslationKey(role);
    return key && t.has(key) ? t(key) : role;
  };
}

/** Display label for an enum/status identifier. */
export function useStatusLabel() {
  const t = useTranslations("status");
  return (status: string): string => {
    const key = STATUS_KEYS[status] ?? status;
    return t.has(key) ? t(key) : status;
  };
}

/** Display label for a menu tag; unknown user tags remain unchanged. */
export function useTagLabel() {
  const t = useTranslations("tags");
  return (tag: string): string => (t.has(tag) ? t(tag) : tag);
}

/** Display label for seeded variant/modifier names; user content falls back as-is. */
export function useMenuContentLabel() {
  const t = useTranslations("menu.content");
  return (name: string): string => (t.has(name) ? t(name) : name);
}
