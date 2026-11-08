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

import type { StaffRole } from "@/types/workspace";

export interface NavItem {
  /** Translation key under the `navigation.items` namespace. */
  titleKey: string;
  href: string;
  icon: LucideIcon;
  /**
   * Provisional role visibility based on docs/roles-and-permissions.md.
   * This is a UX hint only. Backend permission identifiers are not finalized;
   * replace this filtering with the backend authorization contract in Phase 2.
   */
  roles?: readonly StaffRole[];
}

export interface NavSection {
  id: string;
  /** Translation key under the `navigation.sections` namespace. */
  labelKey: string;
  items: readonly NavItem[];
}

const MANAGERS: readonly StaffRole[] = ["owner", "org_admin", "branch_manager"];
const FLOOR: readonly StaffRole[] = [...MANAGERS, "cashier"];
const FLOOR_AND_KITCHEN: readonly StaffRole[] = [...FLOOR, "kitchen"];

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
        roles: FLOOR,
      },
      {
        titleKey: "navigation.items.orders",
        href: "/orders",
        icon: Receipt,
        roles: FLOOR_AND_KITCHEN,
      },
      {
        titleKey: "navigation.items.tables",
        href: "/tables",
        icon: TableProperties,
        roles: FLOOR,
      },
      {
        titleKey: "navigation.items.kitchen",
        href: "/kitchen",
        icon: ChefHat,
        roles: FLOOR_AND_KITCHEN,
      },
      {
        titleKey: "navigation.items.queue",
        href: "/queue",
        icon: ListOrdered,
        roles: [...FLOOR, "host"],
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
        roles: ["owner", "org_admin"],
      },
      {
        titleKey: "navigation.items.menu",
        href: "/menu",
        icon: UtensilsCrossed,
        roles: FLOOR_AND_KITCHEN,
      },
      {
        titleKey: "navigation.items.staff",
        href: "/staff",
        icon: Users,
        roles: MANAGERS,
      },
      {
        titleKey: "navigation.items.branches",
        href: "/branches",
        icon: Store,
        roles: MANAGERS,
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
        icon: BarChart3,
        roles: MANAGERS,
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
        icon: CreditCard,
        roles: ["owner"],
      },
      {
        titleKey: "navigation.items.settings",
        href: "/settings",
        icon: Settings,
        roles: MANAGERS,
      },
    ],
  },
];

export function getNavigationForRole(role: StaffRole): NavSection[] {
  return NAVIGATION_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || item.roles.includes(role)),
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
