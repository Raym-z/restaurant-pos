import type { KitchenStation, KitchenTicket } from "../contracts";

export function uuid(suffix: number): string {
  return `00000000-0000-4000-8000-${String(suffix).padStart(12, "0")}`;
}

export function makeTicket(overrides: Partial<KitchenTicket> = {}): KitchenTicket {
  return {
    ticketId: uuid(1),
    organizationId: uuid(2),
    branchId: uuid(3),
    stationId: uuid(4),
    stationName: "Hot line",
    generation: 1,
    status: "pending",
    startedAt: null,
    readyAt: null,
    completedAt: null,
    cancelledAt: null,
    cancelledByActorType: null,
    cancelledByStaffId: null,
    cancellationReason: null,
    createdAt: "2026-11-10T10:00:00Z",
    updatedAt: "2026-11-10T10:00:00Z",
    order: {
      orderId: uuid(5),
      orderReference: "ORD-0001",
      status: "accepted",
      source: "staff",
      acceptedAt: "2026-11-10T09:59:00Z",
      notes: null,
      tableId: uuid(6),
      tableLabel: "T1",
    },
    items: [
      {
        ticketItemId: uuid(7),
        ticketId: uuid(1),
        orderItemId: uuid(8),
        menuItemId: uuid(9),
        name: "Nasi Goreng",
        quantity: 2,
        notes: "No chili",
        status: "pending",
        startedAt: null,
        readyAt: null,
        completedAt: null,
        cancelledAt: null,
        cancelledByActorType: null,
        cancelledByStaffId: null,
        cancellationReason: null,
        createdAt: "2026-11-10T10:00:00Z",
        updatedAt: "2026-11-10T10:00:00Z",
        modifiers: [
          {
            modifierGroupId: uuid(10),
            modifierOptionId: uuid(11),
            groupName: "Spice level",
            optionName: "Mild",
          },
        ],
      },
    ],
    ...overrides,
  };
}

export function makeStation(overrides: Partial<KitchenStation> = {}): KitchenStation {
  return {
    stationId: uuid(4),
    organizationId: uuid(2),
    branchId: uuid(3),
    name: "Hot line",
    description: "Grill and fry",
    status: "active",
    deactivatedAt: null,
    createdAt: "2026-11-10T09:00:00Z",
    updatedAt: "2026-11-10T09:00:00Z",
    categoryRoutes: [],
    itemRoutes: [],
    ...overrides,
  };
}
