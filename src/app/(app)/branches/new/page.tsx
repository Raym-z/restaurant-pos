import type { Metadata } from "next";

import { PageHeader, PageStack } from "@/components/layout/page";
import { BranchForm } from "@/features/branches/components/branch-form";

export const metadata: Metadata = {
  title: "New branch",
};

export default function NewBranchPage() {
  return (
    <PageStack>
      <PageHeader
        eyebrow="Branch"
        title="New branch"
        description="Add a restaurant location with its contact details and business hours."
        backLink={{ href: "/branches", label: "Back to branches" }}
      />
      <BranchForm />
    </PageStack>
  );
}
