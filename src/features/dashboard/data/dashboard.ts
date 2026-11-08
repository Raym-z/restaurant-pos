import type { DashboardData } from "../types";
import type { Money } from "@/features/shared/domain";

const money = (amountMinor: number): Money => ({
  amountMinor,
  currency: "USD",
});

const DOWNTOWN = "branch_downtown";
const HARBOUR = "branch_harbour";

/**
 * Sample dashboard snapshot for a Sunday lunch service.
 *
 * Figures are internally consistent: branch revenue and order counts sum to
 * the organization totals shown in the KPI row.
 */
export const mockDashboard: DashboardData = {
  asOf: "2026-11-08T18:45:00Z",
  comparisonWindowLabel: "vs. last Sunday",
  metrics: [
    {
      id: "net-sales",
      label: "Net sales",
      value: 846250,
      format: "currency",
      currency: "USD",
      changeRatio: 0.124,
      comparisonLabel: "vs. last Sunday",
    },
    {
      id: "orders",
      label: "Orders",
      value: 214,
      format: "number",
      changeRatio: 0.081,
      comparisonLabel: "vs. last Sunday",
    },
    {
      id: "average-order-value",
      label: "Average order value",
      value: 3954,
      format: "currency",
      currency: "USD",
      changeRatio: 0.039,
      comparisonLabel: "vs. last Sunday",
    },
    {
      id: "staff-on-shift",
      label: "Staff on shift",
      value: 18,
      format: "number",
      changeRatio: null,
      comparisonLabel: "Across 2 open branches",
    },
  ],
  salesTrend: [
    { date: "2026-11-02", revenue: money(612000), orders: 168 },
    { date: "2026-11-03", revenue: money(584500), orders: 159 },
    { date: "2026-11-04", revenue: money(638000), orders: 173 },
    { date: "2026-11-05", revenue: money(721500), orders: 189 },
    { date: "2026-11-06", revenue: money(934000), orders: 238 },
    { date: "2026-11-07", revenue: money(1052700), orders: 261 },
    { date: "2026-11-08", revenue: money(846250), orders: 214 },
  ],
  branchPerformance: [
    {
      branchId: DOWNTOWN,
      revenue: money(512000),
      orders: 128,
      averageOrderValue: money(4000),
      revenueShare: 0.605,
      changeRatio: 0.092,
    },
    {
      branchId: HARBOUR,
      revenue: money(334250),
      orders: 86,
      averageOrderValue: money(3887),
      revenueShare: 0.395,
      changeRatio: 0.146,
    },
  ],
  topSellingItems: [
    {
      menuItemId: "b1000000-0000-4000-8000-000000000005",
      name: "Lamb Kofta Plate",
      categoryName: "Wood-Fired Mains",
      quantitySold: 64,
      revenue: money(179200),
    },
    {
      menuItemId: "b1000000-0000-4000-8000-000000000007",
      name: "Saffron Seafood Risotto",
      categoryName: "Wood-Fired Mains",
      quantitySold: 38,
      revenue: money(129200),
    },
    {
      menuItemId: "b1000000-0000-4000-8000-000000000006",
      name: "Harissa Chicken",
      categoryName: "Wood-Fired Mains",
      quantitySold: 47,
      revenue: money(122200),
    },
    {
      menuItemId: "b1000000-0000-4000-8000-000000000004",
      name: "Wood-Fired Flatbread",
      categoryName: "Starters & Mezze",
      quantitySold: 71,
      revenue: money(113600),
    },
    {
      menuItemId: "b1000000-0000-4000-8000-000000000018",
      name: "Pomegranate Spritz",
      categoryName: "Beverages",
      quantitySold: 84,
      revenue: money(75600),
    },
  ],
  recentOrders: [
    {
      id: "91000000-0000-4000-8000-000000000042",
      orderNumber: "#1042",
      branchId: DOWNTOWN,
      tableLabel: "T-12",
      status: "completed",
      total: money(8650),
      placedAt: "2026-11-08T18:38:00Z",
    },
    {
      id: "91000000-0000-4000-8000-000000000041",
      orderNumber: "#1041",
      branchId: HARBOUR,
      tableLabel: "T-04",
      status: "preparing",
      total: money(5400),
      placedAt: "2026-11-08T18:36:00Z",
    },
    {
      id: "91000000-0000-4000-8000-000000000040",
      orderNumber: "#1040",
      branchId: DOWNTOWN,
      tableLabel: "T-08",
      status: "ready",
      total: money(3950),
      placedAt: "2026-11-08T18:31:00Z",
    },
    {
      id: "91000000-0000-4000-8000-000000000039",
      orderNumber: "#1039",
      branchId: HARBOUR,
      tableLabel: "Bar 2",
      status: "new",
      total: money(11200),
      placedAt: "2026-11-08T18:29:00Z",
    },
    {
      id: "91000000-0000-4000-8000-000000000038",
      orderNumber: "#1038",
      branchId: HARBOUR,
      tableLabel: "T-15",
      status: "completed",
      total: money(2800),
      placedAt: "2026-11-08T18:22:00Z",
    },
    {
      id: "91000000-0000-4000-8000-000000000037",
      orderNumber: "#1037",
      branchId: DOWNTOWN,
      tableLabel: "T-02",
      status: "preparing",
      total: money(6725),
      placedAt: "2026-11-08T18:18:00Z",
    },
    {
      id: "91000000-0000-4000-8000-000000000036",
      orderNumber: "#1036",
      branchId: DOWNTOWN,
      tableLabel: "T-06",
      status: "ready",
      total: money(4300),
      placedAt: "2026-11-08T18:12:00Z",
    },
    {
      id: "91000000-0000-4000-8000-000000000035",
      orderNumber: "#1035",
      branchId: HARBOUR,
      tableLabel: "T-09",
      status: "cancelled",
      total: money(0),
      placedAt: "2026-11-08T18:04:00Z",
    },
  ],
  attentionItems: [
    {
      id: "menu-availability",
      tone: "warning",
      title: "1 menu item is marked unavailable",
      description:
        "Charred Cauliflower Steak is unavailable at Harbour and sold out at organization level.",
      branchId: null,
    },
    {
      id: "staff-invites",
      tone: "info",
      title: "2 staff invitations are awaiting acceptance",
      description:
        "Nadia Haddad (Harbour manager) and Owen Wright (Downtown cashier) have not signed in yet.",
      branchId: null,
    },
    {
      id: "manager-vacancy",
      tone: "info",
      title: "Harbour has no branch manager",
      description: "Nadia Haddad's branch manager invitation is still pending acceptance.",
      branchId: HARBOUR,
    },
  ],
  operationalSnapshot: {
    kitchenOpenOrders: 14,
    tablesSeated: 26,
    tablesTotal: 52,
    guestsWaiting: 9,
    staffOnShift: 18,
  },
};
