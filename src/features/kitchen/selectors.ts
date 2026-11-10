import {
  KITCHEN_ACTIVE_STATUSES,
  type KitchenActiveStatus,
  type KitchenTicket,
  type KitchenTicketStatus,
} from "./contracts";

export const KITCHEN_WARNING_AFTER_MINUTES = 10;
export const KITCHEN_URGENT_AFTER_MINUTES = 20;

export type KitchenTicketGrouping = Record<KitchenActiveStatus, KitchenTicket[]>;

export type KitchenTicketUrgency = "normal" | "warning" | "urgent";

export interface KitchenTicketCounts {
  pending: number;
  preparing: number;
  ready: number;
  total: number;
}

/** Backend order is oldest-first; keep the same deterministic order client-side. */
export function sortKitchenTicketsOldestFirst(tickets: readonly KitchenTicket[]): KitchenTicket[] {
  return [...tickets].sort((left, right) => {
    const byCreatedAt = left.createdAt.localeCompare(right.createdAt);
    return byCreatedAt !== 0 ? byCreatedAt : left.ticketId.localeCompare(right.ticketId);
  });
}

export function groupKitchenTickets(tickets: readonly KitchenTicket[]): KitchenTicketGrouping {
  const grouped: KitchenTicketGrouping = {
    pending: [],
    preparing: [],
    ready: [],
  };

  for (const ticket of sortKitchenTicketsOldestFirst(tickets)) {
    if (isActiveKitchenStatus(ticket.status)) {
      grouped[ticket.status].push(ticket);
    }
  }

  return grouped;
}

export function isActiveKitchenStatus(status: KitchenTicketStatus): status is KitchenActiveStatus {
  return (KITCHEN_ACTIVE_STATUSES as readonly string[]).includes(status);
}

export function kitchenTicketCounts(tickets: readonly KitchenTicket[]): KitchenTicketCounts {
  const counts: KitchenTicketCounts = {
    pending: 0,
    preparing: 0,
    ready: 0,
    total: 0,
  };

  for (const ticket of tickets) {
    if (isActiveKitchenStatus(ticket.status)) {
      counts[ticket.status] += 1;
      counts.total += 1;
    }
  }

  return counts;
}

export function elapsedMinutes(
  createdAt: string,
  now: Date | string | number = Date.now(),
): number {
  const start = new Date(createdAt).getTime();
  const end = now instanceof Date ? now.getTime() : new Date(now).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 0;
  }

  return Math.max(0, Math.floor((end - start) / 60_000));
}

export function kitchenUrgencyForMinutes(minutes: number): KitchenTicketUrgency {
  if (minutes >= KITCHEN_URGENT_AFTER_MINUTES) {
    return "urgent";
  }

  if (minutes >= KITCHEN_WARNING_AFTER_MINUTES) {
    return "warning";
  }

  return "normal";
}

export function kitchenTicketUrgency(
  ticket: KitchenTicket,
  now: Date | string | number = Date.now(),
): KitchenTicketUrgency {
  return kitchenUrgencyForMinutes(elapsedMinutes(ticket.createdAt, now));
}

export function kitchenTicketItemProgress(ticket: KitchenTicket): {
  completed: number;
  total: number;
} {
  const activeItems = ticket.items.filter((item) => item.status !== "cancelled");
  return {
    completed: activeItems.filter((item) => item.status === "completed").length,
    total: activeItems.length,
  };
}
