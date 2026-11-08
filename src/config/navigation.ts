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
  title: string;
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
  label: string;
  items: readonly NavItem[];
}

const MANAGERS: readonly StaffRole[] = ["owner", "org_admin", "branch_manager"];
const FLOOR: readonly StaffRole[] = [...MANAGERS, "cashier"];
const FLOOR_AND_KITCHEN: readonly StaffRole[] = [...FLOOR, "kitchen"];

export const NAVIGATION_SECTIONS: readonly NavSection[] = [
  {
    id: "operate",
    label: "Operate",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Point of Sale", href: "/pos", icon: ShoppingCart, roles: FLOOR },
      { title: "Orders", href: "/orders", icon: Receipt, roles: FLOOR_AND_KITCHEN },
      { title: "Tables", href: "/tables", icon: TableProperties, roles: FLOOR },
      { title: "Kitchen Display", href: "/kitchen", icon: ChefHat, roles: FLOOR_AND_KITCHEN },
      {
        title: "Queue",
        href: "/queue",
        icon: ListOrdered,
        roles: [...FLOOR, "host"],
      },
    ],
  },
  {
    id: "manage",
    label: "Manage",
    items: [
      {
        title: "Organization",
        href: "/organization",
        icon: Building2,
        roles: ["owner", "org_admin"],
      },
      { title: "Menu", href: "/menu", icon: UtensilsCrossed, roles: FLOOR_AND_KITCHEN },
      { title: "Staff", href: "/staff", icon: Users, roles: MANAGERS },
      { title: "Branches", href: "/branches", icon: Store, roles: MANAGERS },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    items: [{ title: "Reports", href: "/reports", icon: BarChart3, roles: MANAGERS }],
  },
  {
    id: "administer",
    label: "Administer",
    items: [
      { title: "Billing", href: "/billing", icon: CreditCard, roles: ["owner"] },
      { title: "Settings", href: "/settings", icon: Settings, roles: MANAGERS },
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
