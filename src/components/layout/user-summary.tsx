"use client";

import { Avatar } from "@/components/ui/avatar";
import { useRoleLabel } from "@/i18n/use-labels";
import { useWorkspace } from "@/providers/workspace-provider";

export function UserSummary() {
  const { user } = useWorkspace();
  const roleLabel = useRoleLabel();

  return (
    <div className="flex items-center gap-2.5 border-l border-line pl-3">
      <Avatar name={user.name} size="sm" />
      <div className="hidden min-w-0 md:block">
        <p className="truncate text-[13px] leading-tight font-medium text-ink">{user.name}</p>
        <p className="mt-0.5 truncate text-[11px] leading-tight text-ink-subtle">
          {roleLabel(user.role)}
        </p>
      </div>
    </div>
  );
}
