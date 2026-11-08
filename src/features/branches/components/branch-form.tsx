"use client";

import { Store } from "lucide-react";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/states/empty-state";
import { Card } from "@/components/ui/card";

/**
 * Branch creation and editing are intentionally disabled in M1.
 *
 * The full form is preserved in git history and will be restored when the
 * backend exposes complete branch profile fields and RPC contracts.
 */
export function BranchForm() {
  const t = useTranslations("placeholders.unavailable.branchEdit");

  return (
    <Card className="p-4">
      <EmptyState bordered={false} icon={Store} title={t("title")} description={t("description")} />
    </Card>
  );
}
