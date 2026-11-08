import type { Metadata } from "next";

import { OrganizationScreen } from "@/features/organization/components/organization-screen";

export const metadata: Metadata = {
  title: "Organization",
};

export default function OrganizationPage() {
  return <OrganizationScreen />;
}
