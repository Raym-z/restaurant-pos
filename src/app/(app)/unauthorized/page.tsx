import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader, PageStack } from "@/components/layout/page";
import { UnauthorizedState } from "@/components/states/unauthorized-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Access restricted",
};

export default function UnauthorizedPage() {
  return (
    <PageStack>
      <PageHeader
        title="Access restricted"
        description="This area is available only to staff with the required role and branch access."
      />
      <UnauthorizedState
        action={
          <Button asChild variant="secondary">
            <Link href="/dashboard">
              <ArrowLeft />
              Return to dashboard
            </Link>
          </Button>
        }
      />
    </PageStack>
  );
}
