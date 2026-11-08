import { ListOrdered } from "lucide-react";
import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const metadata: Metadata = {
  title: "Queue",
};

export default function QueuePage() {
  return (
    <ModulePlaceholder
      title="Queue"
      description="Manage customer waits, check-ins, and seating."
      icon={ListOrdered}
      phase="Phase 9"
      planned={["Active queue", "Call and seat", "Status transitions", "Branch scope"]}
    />
  );
}
