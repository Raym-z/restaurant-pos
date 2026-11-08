import { Receipt } from "lucide-react";
import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const metadata: Metadata = {
  title: "Orders",
};

export default function OrdersPage() {
  return (
    <ModulePlaceholder
      title="Orders"
      description="Review, update, and complete active and past orders."
      icon={Receipt}
      phase="Phase 7"
      planned={["Order list", "Status filters", "Order detail", "Cancellation workflow"]}
    />
  );
}
