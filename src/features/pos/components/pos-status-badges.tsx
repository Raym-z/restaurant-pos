"use client";

import { Badge } from "@/components/ui/badge";
import { useStatusLabel } from "@/i18n/use-labels";

import type { OrderItemStatus, OrderStatus, TableAvailability } from "../contracts";

type BadgeVariant = "neutral" | "brand" | "accent" | "success" | "warning" | "danger" | "info";

const ORDER_STATUS_VARIANTS: Record<OrderStatus, BadgeVariant> = {
  pending: "warning",
  accepted: "info",
  preparing: "brand",
  ready: "accent",
  served: "success",
  completed: "success",
  cancelled: "neutral",
};

const ITEM_STATUS_VARIANTS: Record<OrderItemStatus, BadgeVariant> = {
  pending: "warning",
  accepted: "info",
  preparing: "brand",
  ready: "accent",
  served: "success",
  cancelled: "neutral",
};

const TABLE_AVAILABILITY_VARIANTS: Record<TableAvailability, BadgeVariant> = {
  available: "success",
  occupied: "warning",
  inactive: "neutral",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const statusLabel = useStatusLabel();
  return <Badge variant={ORDER_STATUS_VARIANTS[status]}>{statusLabel(status)}</Badge>;
}

export function OrderItemStatusBadge({ status }: { status: OrderItemStatus }) {
  const statusLabel = useStatusLabel();
  return <Badge variant={ITEM_STATUS_VARIANTS[status]}>{statusLabel(status)}</Badge>;
}

export function TableAvailabilityBadge({ availability }: { availability: TableAvailability }) {
  const statusLabel = useStatusLabel();
  return (
    <Badge variant={TABLE_AVAILABILITY_VARIANTS[availability]}>{statusLabel(availability)}</Badge>
  );
}
