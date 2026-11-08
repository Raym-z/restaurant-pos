import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { StaffEditScreen } from "@/features/staff/components/staff-edit-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("editStaff") };
}

export default function EditStaffPage() {
  return <StaffEditScreen />;
}
