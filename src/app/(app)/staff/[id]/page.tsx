import type { Metadata } from "next";

import { StaffDetailScreen } from "@/features/staff/components/staff-detail-screen";

export const metadata: Metadata = {
  title: "Staff member",
};

export default function StaffDetailPage() {
  return <StaffDetailScreen />;
}
