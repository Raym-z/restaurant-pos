import type { Metadata } from "next";

import { BranchEditScreen } from "@/features/branches/components/branch-edit-screen";

export const metadata: Metadata = {
  title: "Edit branch",
};

export default function EditBranchPage() {
  return <BranchEditScreen />;
}
