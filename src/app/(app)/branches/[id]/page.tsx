import type { Metadata } from "next";

import { BranchDetailScreen } from "@/features/branches/components/branch-detail-screen";

export const metadata: Metadata = {
  title: "Branch details",
};

export default function BranchDetailPage() {
  return <BranchDetailScreen />;
}
