import { CreditCard } from "lucide-react";
import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const metadata: Metadata = {
  title: "Billing",
};

export default function BillingPage() {
  return (
    <ModulePlaceholder
      title="Billing"
      description="Manage the organization's subscription and billing details."
      icon={CreditCard}
      phase="Phase 10"
      planned={["Plan overview", "Invoices", "Entitlements", "Payment status"]}
    />
  );
}
