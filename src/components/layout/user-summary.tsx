"use client";

import { Avatar } from "@/components/ui/avatar";
import { useWorkspace } from "@/providers/workspace-provider";
import { STAFF_ROLE_LABELS } from "@/types/workspace";

export function UserSummary() {
  const { user } = useWorkspace();

  return (
    <div className="flex items-center gap-2.5 border-l border-line pl-3">
      <Avatar name={user.name} size="sm" />
      <div className="hidden min-w-0 md:block">
        <p className="truncate text-[13px] leading-tight font-medium text-ink">{user.name}</p>
        <p className="mt-0.5 truncate text-[11px] leading-tight text-ink-subtle">
          {STAFF_ROLE_LABELS[user.role]}
        </p>
      </div>
    </div>
  );
}
