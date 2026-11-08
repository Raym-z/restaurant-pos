"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Store } from "lucide-react";

import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { useMockData } from "@/features/shared/mock-data-provider";
import { BranchForm } from "./branch-form";

export function BranchEditScreen() {
  const params = useParams<{ id: string }>();
  const { branches } = useMockData();
  const branch = branches.find((entry) => entry.id === params.id);

  if (!branch) {
    return (
      <PageStack>
        <PageHeader
          title="Branch not found"
          backLink={{ href: "/branches", label: "Back to branches" }}
        />
        <EmptyState
          icon={Store}
          title="This branch could not be found"
          description="It may have been removed, or the link is no longer valid."
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/branches">Back to branches</Link>
            </Button>
          }
        />
      </PageStack>
    );
  }

  return (
    <PageStack>
      <PageHeader
        eyebrow="Branch"
        title={`Edit ${branch.name}`}
        description={`Update profile, contact details, and business hours for ${branch.code}.`}
        backLink={{ href: `/branches/${branch.id}`, label: "Back to branch" }}
      />
      <BranchForm branch={branch} />
    </PageStack>
  );
}
