import {
  BarChart3,
  Building2,
  ChefHat,
  CreditCard,
  LayoutDashboard,
  ListOrdered,
  Receipt,
  Settings,
  ShoppingCart,
  Store,
  TableProperties,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { StaffRole } from "../types/roles";

export type NavAvailability = "available" | "unavailable";

export interface NavAccess {
  /** Any one of these roles grants the item. Omit to allow every active role. */
  roles?: readonly StaffRole[];
  /** Requires an organization-scoped Owner or Admin role. */
  orgAdmin?: boolean;
  /** Requires any organization-scoped role. */
  organizationScope?: boolean;
}

export interface NavItem {
  /** Translation key under the `navigation.items` namespace. */
  titleKey: string;
  href: string;
  icon: LucideIcon;
  access?: NavAccess;
  /**
   * `unavailable` marks a route that exists but is intentionally not connected
   * in this milestone. It must not imply functional access.
   */
  availability?: NavAvailability;
}

export interface NavSection {
  id: string;
  /** Translation key under the `navigation.sections` namespace. */
  labelKey: string;
  items: readonly NavItem[];
}

const FLOOR: readonly StaffRole[] = ["owner", "admin", "manager", "cashier"];
const FLOOR_AND_KITCHEN: readonly StaffRole[] = [...FLOOR, "kitchen_staff"];
const MANAGEMENT: readonly StaffRole[] = ["owner", "admin", "manager"];

export const NAVIGATION_SECTIONS: readonly NavSection[] = [
  {
    id: "operate",
    labelKey: "navigation.sections.operate",
    items: [
      {
        titleKey: "navigation.items.dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        titleKey: "navigation.items.pos",
        href: "/pos",
        icon: ShoppingCart,
        access: { roles: FLOOR },
      },
      {
        titleKey: "navigation.items.orders",
        href: "/orders",
        icon: Receipt,
        access: { roles: FLOOR_AND_KITCHEN },
      },
      {
        titleKey: "navigation.items.tables",
        href: "/tables",
        icon: TableProperties,
        access: { roles: FLOOR },
      },
      {
        titleKey: "navigation.items.kitchen",
        href: "/kitchen",
        availability: "unavailable",
        icon: ChefHat,
        access: { roles: FLOOR_AND_KITCHEN },
      },
      {
        titleKey: "navigation.items.queue",
        href: "/queue",
        availability: "unavailable",
        icon: ListOrdered,
        access: { roles: FLOOR },
      },
    ],
  },
  {
    id: "manage",
    labelKey: "navigation.sections.manage",
    items: [
      {
        titleKey: "navigation.items.organization",
        href: "/organization",
        icon: Building2,
        access: { orgAdmin: true },
      },
      {
        titleKey: "navigation.items.menu",
        href: "/menu",
        icon: UtensilsCrossed,
      },
      {
        titleKey: "navigation.items.staff",
        href: "/staff",
        icon: Users,
        access: { orgAdmin: true },
        availability: "unavailable",
      },
      {
        titleKey: "navigation.items.branches",
        href: "/branches",
        icon: Store,
        access: { roles: MANAGEMENT },
      },
    ],
  },
  {
    id: "insights",
    labelKey: "navigation.sections.insights",
    items: [
      {
        titleKey: "navigation.items.reports",
        href: "/reports",
        availability: "unavailable",
        icon: BarChart3,
        access: { roles: MANAGEMENT },
      },
    ],
  },
  {
    id: "administer",
    labelKey: "navigation.sections.administer",
    items: [
      {
        titleKey: "navigation.items.billing",
        href: "/billing",
        availability: "unavailable",
        icon: CreditCard,
        access: { roles: ["owner"] },
      },
      {
        titleKey: "navigation.items.settings",
        href: "/settings",
        availability: "unavailable",
        icon: Settings,
        access: { roles: MANAGEMENT },
      },
    ],
  },
];

export interface NavigationContext {
  roles: readonly StaffRole[];
  isOrganizationScoped: boolean;
  isOrgAdmin: boolean;
}

function canSeeItem(item: NavItem, context: NavigationContext): boolean {
  const roleSet = new Set(context.roles);

  if (item.access?.orgAdmin && !context.isOrgAdmin) {
    return false;
  }

  if (item.access?.organizationScope && !context.isOrganizationScoped) {
    return false;
  }

  if (item.access?.roles && !item.access.roles.some((role) => roleSet.has(role))) {
    return false;
  }

  return true;
}

export function getNavigationForContext(context: NavigationContext): NavSection[] {
  return NAVIGATION_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => canSeeItem(item, context)),
  })).filter((section) => section.items.length > 0);
}

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface ActiveNavigation {
  section: NavSection;
  item: NavItem;
}

export function findActiveNavigation(pathname: string): ActiveNavigation | null {
  let bestMatch: ActiveNavigation | null = null;

  for (const section of NAVIGATION_SECTIONS) {
    for (const item of section.items) {
      if (isNavItemActive(pathname, item.href)) {
        if (!bestMatch || item.href.length > bestMatch.item.href.length) {
          bestMatch = { section, item };
        }
      }
    }
  }

  return bestMatch;
}
