import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { PageHeader, PageStack } from "@/components/layout/page";
import { InviteStaffForm } from "@/features/staff/components/invite-staff-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("inviteStaff") };
}

export default async function NewStaffPage() {
  const t = await getTranslations("staff.form");
  const tDetail = await getTranslations("staff.detail");

  return (
    <PageStack>
      <PageHeader
        eyebrow={tDetail("eyebrow")}
        title={t("newTitle")}
        description={t("newDescription")}
        backLink={{ href: "/staff", label: tDetail("back") }}
      />
      <InviteStaffForm />
    </PageStack>
  );
}
