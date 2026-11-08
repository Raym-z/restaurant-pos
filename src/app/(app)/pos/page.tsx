import { ShoppingCart } from "lucide-react";
import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const metadata: Metadata = {
  title: "Point of Sale",
};

export default function PosPage() {
  return (
    <ModulePlaceholder
      title="Point of Sale"
      description="Create and manage orders from the cashier counter."
      icon={ShoppingCart}
      phase="Phase 7"
      planned={["Order builder", "Table association", "Cash payments", "Order lifecycle"]}
    />
  );
}
