import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AcceptInvitationScreen } from "@/features/staff/components/accept-invitation-screen";
import { isInvitationToken } from "@/features/staff/invitation-token";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("acceptInvitation") };
}

interface AcceptInvitationPageProps {
  searchParams: Promise<{ invitation?: string }>;
}

export default async function AcceptInvitationPage({ searchParams }: AcceptInvitationPageProps) {
  const params = await searchParams;
  const token = isInvitationToken(params.invitation) ? params.invitation : null;

  return <AcceptInvitationScreen token={token} />;
}
