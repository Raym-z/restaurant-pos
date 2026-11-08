import { BarChart3 } from "lucide-react";
import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const metadata: Metadata = {
  title: "Reports",
};

export default function ReportsPage() {
  return (
    <ModulePlaceholder
      title="Reports"
      description="Review sales, orders, and branch performance."
      icon={BarChart3}
      phase="Phase 10"
      planned={["Sales summary", "Order metrics", "Branch comparison", "Exports"]}
    />
  );
}
