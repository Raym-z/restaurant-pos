"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";

import type { QueueStatus } from "../contracts";

export function QueueStatusBadge({ status }: { status: QueueStatus }) {
  const t = useTranslations("status");

  return (
    <Badge variant={status === "notified" ? "warning" : "info"}>
      {t(status === "notified" ? "notified" : "waiting")}
    </Badge>
  );
}
