import type { DashboardData } from "../types";
import type { Money } from "@/features/shared/domain";
import { DEFAULT_CURRENCY } from "@/lib/currency";

const money = (amountMinor: number): Money => ({
  amountMinor,
  currency: DEFAULT_CURRENCY,
});

const DOWNTOWN = "branch_downtown";
const HARBOUR = "branch_harbour";

/**
 * Sample dashboard snapshot for a Sunday dinner service in Jakarta.
 *
 * Figures are internally consistent: branch revenue and order counts sum to
 * the organization totals shown in the KPI row.
 */
export const mockDashboard: DashboardData = {
  asOf: "2026-11-08T10:45:00Z",
  metrics: [
    {
      id: "net-sales",
      value: 42800000,
      format: "currency",
      currency: DEFAULT_CURRENCY,
      changeRatio: 0.124,
      comparison: "vs-last-sunday",
    },
    {
      id: "orders",
      value: 214,
      format: "number",
      changeRatio: 0.081,
      comparison: "vs-last-sunday",
    },
    {
      id: "average-order-value",
      value: 200000,
      format: "currency",
      currency: DEFAULT_CURRENCY,
      changeRatio: 0.039,
      comparison: "vs-last-sunday",
    },
    {
      id: "staff-on-shift",
      value: 18,
      format: "number",
      changeRatio: null,
      comparison: "across-open-branches",
      comparisonCount: 2,
    },
  ],
  salesTrend: [
    { date: "2026-11-02", revenue: money(31200000), orders: 168 },
    { date: "2026-11-03", revenue: money(29850000), orders: 159 },
    { date: "2026-11-04", revenue: money(32400000), orders: 173 },
    { date: "2026-11-05", revenue: money(36750000), orders: 189 },
    { date: "2026-11-06", revenue: money(47900000), orders: 238 },
    { date: "2026-11-07", revenue: money(52300000), orders: 261 },
    { date: "2026-11-08", revenue: money(42800000), orders: 214 },
  ],
  branchPerformance: [
    {
      branchId: DOWNTOWN,
      revenue: money(25680000),
      orders: 128,
      averageOrderValue: money(200625),
      revenueShare: 0.6,
      changeRatio: 0.092,
    },
    {
      branchId: HARBOUR,
      revenue: money(17120000),
      orders: 86,
      averageOrderValue: money(199070),
      revenueShare: 0.4,
      changeRatio: 0.146,
    },
  ],
  topSellingItems: [
    {
      menuItemId: "b1000000-0000-4000-8000-000000000005",
      name: "Lamb Kofta Plate",
      categoryName: "Wood-Fired Mains",
      quantitySold: 64,
      revenue: money(8640000),
    },
    {
      menuItemId: "b1000000-0000-4000-8000-000000000007",
      name: "Saffron Seafood Risotto",
      categoryName: "Wood-Fired Mains",
      quantitySold: 38,
      revenue: money(7030000),
    },
    {
      menuItemId: "b1000000-0000-4000-8000-000000000006",
      name: "Harissa Chicken",
      categoryName: "Wood-Fired Mains",
      quantitySold: 47,
      revenue: money(5875000),
    },
    {
      menuItemId: "b1000000-0000-4000-8000-000000000004",
      name: "Wood-Fired Flatbread",
      categoryName: "Starters & Mezze",
      quantitySold: 71,
      revenue: money(5325000),
    },
    {
      menuItemId: "b1000000-0000-4000-8000-000000000018",
      name: "Pomegranate Spritz",
      categoryName: "Beverages",
      quantitySold: 84,
      revenue: money(3780000),
    },
  ],
  recentOrders: [
    {
      id: "91000000-0000-4000-8000-000000000042",
      orderNumber: "#1042",
      branchId: DOWNTOWN,
      tableLabel: "T-12",
      status: "completed",
      total: money(285000),
      placedAt: "2026-11-08T10:38:00Z",
    },
    {
      id: "91000000-0000-4000-8000-000000000041",
      orderNumber: "#1041",
      branchId: HARBOUR,
      tableLabel: "T-04",
      status: "preparing",
      total: money(175000),
      placedAt: "2026-11-08T10:36:00Z",
    },
    {
      id: "91000000-0000-4000-8000-000000000040",
      orderNumber: "#1040",
      branchId: DOWNTOWN,
      tableLabel: "T-08",
      status: "ready",
      total: money(95000),
      placedAt: "2026-11-08T10:31:00Z",
    },
    {
      id: "91000000-0000-4000-8000-000000000039",
      orderNumber: "#1039",
      branchId: HARBOUR,
      tableLabel: "Bar 2",
      status: "new",
      total: money(420000),
      placedAt: "2026-11-08T10:29:00Z",
    },
    {
      id: "91000000-0000-4000-8000-000000000038",
      orderNumber: "#1038",
      branchId: HARBOUR,
      tableLabel: "T-15",
      status: "completed",
      total: money(80000),
      placedAt: "2026-11-08T10:22:00Z",
    },
    {
      id: "91000000-0000-4000-8000-000000000037",
      orderNumber: "#1037",
      branchId: DOWNTOWN,
      tableLabel: "T-02",
      status: "preparing",
      total: money(210000),
      placedAt: "2026-11-08T10:18:00Z",
    },
    {
      id: "91000000-0000-4000-8000-000000000036",
      orderNumber: "#1036",
      branchId: DOWNTOWN,
      tableLabel: "T-06",
      status: "ready",
      total: money(135000),
      placedAt: "2026-11-08T10:12:00Z",
    },
    {
      id: "91000000-0000-4000-8000-000000000035",
      orderNumber: "#1035",
      branchId: HARBOUR,
      tableLabel: "T-09",
      status: "cancelled",
      total: money(0),
      placedAt: "2026-11-08T10:04:00Z",
    },
  ],
  attentionItems: [
    {
      id: "menu-availability",
      tone: "warning",
      kind: "menu-unavailable",
      branchId: HARBOUR,
      menuItemId: "b1000000-0000-4000-8000-000000000009",
    },
    {
      id: "staff-invites",
      tone: "info",
      kind: "staff-invites",
      branchId: null,
      staffIds: ["6e7f8a9b-0c1d-4e2f-8a3b-4c5d6e7f8a80", "4c5d6e7f-8a9b-4c0d-8e1f-2a3b4c5d6e91"],
    },
    {
      id: "manager-vacancy",
      tone: "info",
      kind: "manager-vacancy",
      branchId: HARBOUR,
      staffIds: ["6e7f8a9b-0c1d-4e2f-8a3b-4c5d6e7f8a80"],
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
