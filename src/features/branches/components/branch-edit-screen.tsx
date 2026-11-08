"use client";

import { Store } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function BranchEditScreen() {
  const t = useTranslations("placeholders.unavailable.branchEdit");

  return (
    <Card className="p-4">
      <EmptyState
        bordered={false}
        icon={Store}
        title={t("title")}
        description={t("description")}
        action={
          <Button asChild variant="secondary" size="sm">
            <Link href="/branches">{t("back")}</Link>
          </Button>
        }
      />
    </Card>
  );
}
