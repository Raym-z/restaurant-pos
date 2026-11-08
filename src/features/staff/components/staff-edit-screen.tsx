"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { UserRound } from "lucide-react";

import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { useMockData } from "@/features/shared/mock-data-provider";
import { StaffForm } from "./staff-form";

export function StaffEditScreen() {
  const params = useParams<{ id: string }>();
  const { staff } = useMockData();
  const member = staff.find((entry) => entry.id === params.id);

  if (!member) {
    return (
      <PageStack>
        <PageHeader
          title="Staff member not found"
          backLink={{ href: "/staff", label: "Back to staff" }}
        />
        <EmptyState
          icon={UserRound}
          title="This staff member could not be found"
          description="They may have been removed, or the link is no longer valid."
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/staff">Back to staff</Link>
            </Button>
          }
        />
      </PageStack>
    );
  }

  return (
    <PageStack>
      <PageHeader
        eyebrow="Staff"
        title={`Edit ${member.fullName}`}
        description="Update contact details, role, and branch access."
        backLink={{ href: `/staff/${member.id}`, label: "Back to staff member" }}
      />
      <StaffForm member={member} />
    </PageStack>
  );
}
