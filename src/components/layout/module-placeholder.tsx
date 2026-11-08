import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  phase: string;
  planned?: readonly string[];
  showBackLink?: boolean;
}

/**
 * Temporary page body for routes reserved for later roadmap phases.
 * Feature agents should replace the placeholder with real screens while
 * keeping the PageHeader + PageStack structure.
 */
export function ModulePlaceholder({
  title,
  description,
  icon,
  phase,
  planned = [],
  showBackLink = true,
}: ModulePlaceholderProps) {
  return (
    <PageStack>
      <PageHeader
        title={title}
        description={description}
        actions={<Badge variant="outline">{phase}</Badge>}
      />
      <Card className="overflow-hidden">
        <EmptyState
          icon={icon}
          bordered={false}
          title={`${title} is not connected yet`}
          description="The workspace shell, navigation, design system, and shared components are in place. This module will be enabled as its roadmap phase is implemented."
          action={
            showBackLink ? (
              <Button asChild variant="secondary" size="sm">
                <Link href="/dashboard">
                  Back to overview
                  <ArrowRight />
                </Link>
              </Button>
            ) : undefined
          }
        />
        {planned.length > 0 ? (
          <div className="border-t border-line bg-surface-subtle px-5 py-4">
            <p className="text-xs font-medium tracking-wider text-ink-subtle uppercase">
              Planned capabilities
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {planned.map((capability) => (
                <Badge key={capability} variant="neutral">
                  {capability}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </Card>
    </PageStack>
  );
}
