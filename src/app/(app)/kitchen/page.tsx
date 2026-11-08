import { ChefHat } from "lucide-react";
import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const metadata: Metadata = {
  title: "Kitchen Display",
};

export default function KitchenPage() {
  return (
    <ModulePlaceholder
      title="Kitchen Display"
      description="A focused kitchen interface for incoming orders and preparation status."
      icon={ChefHat}
      phase="Phase 8"
      planned={[
        "Dedicated KDS layout",
        "Realtime tickets",
        "Preparation status",
        "Reconnection recovery",
      ]}
    />
  );
}
