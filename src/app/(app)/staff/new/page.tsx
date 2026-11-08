import type { Metadata } from "next";

import { PageHeader, PageStack } from "@/components/layout/page";
import { StaffForm } from "@/features/staff/components/staff-form";

export const metadata: Metadata = {
  title: "Invite staff",
};

export default function NewStaffPage() {
  return (
    <PageStack>
      <PageHeader
        eyebrow="Staff"
        title="Invite staff member"
        description="Send a mock invitation and assign an initial role and branch access."
        backLink={{ href: "/staff", label: "Back to staff" }}
      />
      <StaffForm />
    </PageStack>
  );
}
