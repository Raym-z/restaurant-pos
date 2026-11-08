"use client";

import { Store } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";

import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/providers/workspace-provider";
import { BranchForm } from "./branch-form";

export function BranchEditScreen() {
  const params = useParams<{ id: string }>();
  const { branches } = useWorkspace();
  const t = useTranslations("branches");
  const tForm = useTranslations("branches.form");
  const branch = branches.find((entry) => entry.id === params.id);

  if (!branch) {
    return (
      <PageStack>
        <PageHeader
          title={t("detail.notFoundTitle")}
          backLink={{ href: "/branches", label: t("detail.back") }}
        />
        <EmptyState
          icon={Store}
          title={t("detail.notFoundTitle")}
          description={t("detail.notFoundDescription")}
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/branches">{t("detail.backToBranches")}</Link>
            </Button>
          }
        />
      </PageStack>
    );
  }

  return (
    <PageStack>
      <PageHeader
        eyebrow={t("detail.eyebrow")}
        title={tForm("editTitle", { name: branch.name })}
        description={tForm("editDescription", { code: branch.code })}
        backLink={{
          href: `/branches/${branch.id}`,
          label: t("detail.back"),
        }}
      />
      <BranchForm branch={branch} />
    </PageStack>
  );
}
