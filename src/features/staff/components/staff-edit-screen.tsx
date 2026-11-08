"use client";

import { UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";

import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { useMockData } from "@/features/shared/mock-data-provider";
import { StaffForm } from "./staff-form";

export function StaffEditScreen() {
  const params = useParams<{ id: string }>();
  const { staff } = useMockData();
  const t = useTranslations("staff");
  const tForm = useTranslations("staff.form");
  const member = staff.find((entry) => entry.id === params.id);

  if (!member) {
    return (
      <PageStack>
        <PageHeader
          title={t("detail.notFoundTitle")}
          backLink={{ href: "/staff", label: t("detail.back") }}
        />
        <EmptyState
          icon={UserRound}
          title={t("detail.notFoundTitle")}
          description={t("detail.notFoundDescription")}
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/staff">{t("detail.backToStaff")}</Link>
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
        title={tForm("editTitle", { name: member.fullName })}
        description={tForm("editDescription")}
        backLink={{
          href: `/staff/${member.id}`,
          label: t("detail.back"),
        }}
      />
      <StaffForm member={member} />
    </PageStack>
  );
}
