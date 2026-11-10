"use client";

import { Badge } from "@/components/ui/badge";
import { useStatusLabel } from "@/i18n/use-labels";

import type { KitchenTicketItemStatus, KitchenTicketStatus } from "../contracts";

type BadgeVariant = "neutral" | "brand" | "accent" | "success" | "warning" | "danger" | "info";

const TICKET_STATUS_VARIANTS: Record<KitchenTicketStatus, BadgeVariant> = {
  pending: "warning",
  preparing: "brand",
  ready: "accent",
  completed: "success",
  cancelled: "neutral",
};

const ITEM_STATUS_VARIANTS: Record<KitchenTicketItemStatus, BadgeVariant> = {
  pending: "warning",
  preparing: "brand",
  ready: "accent",
  completed: "success",
  cancelled: "neutral",
};

export function KitchenTicketStatusBadge({
  status,
  className,
}: {
  status: KitchenTicketStatus;
  className?: string;
}) {
  const statusLabel = useStatusLabel();
  return (
    <Badge variant={TICKET_STATUS_VARIANTS[status]} className={className}>
      {statusLabel(status)}
    </Badge>
  );
}

export function KitchenItemStatusBadge({
  status,
  className,
}: {
  status: KitchenTicketItemStatus;
  className?: string;
}) {
  const statusLabel = useStatusLabel();
  return (
    <Badge variant={ITEM_STATUS_VARIANTS[status]} className={className}>
      {statusLabel(status)}
    </Badge>
  );
}
