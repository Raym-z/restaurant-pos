import { Settings } from "lucide-react";
import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <ModulePlaceholder
      title="Settings"
      description="Configure organization, branch, and application preferences."
      icon={Settings}
      phase="Phase 10"
      planned={["Organization profile", "Branch settings", "Notifications", "Preferences"]}
    />
  );
}
