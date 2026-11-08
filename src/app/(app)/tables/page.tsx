import { TableProperties } from "lucide-react";
import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const metadata: Metadata = {
  title: "Tables",
};

export default function TablesPage() {
  return (
    <ModulePlaceholder
      title="Tables"
      description="Configure the floor plan and manage table availability."
      icon={TableProperties}
      phase="Phase 6"
      planned={["Floor plan", "Table status", "Dining sessions", "QR generation"]}
    />
  );
}
