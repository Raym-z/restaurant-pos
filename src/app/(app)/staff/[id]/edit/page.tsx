import type { Metadata } from "next";

import { StaffEditScreen } from "@/features/staff/components/staff-edit-screen";

export const metadata: Metadata = {
  title: "Edit staff member",
};

export default function EditStaffPage() {
  return <StaffEditScreen />;
}
