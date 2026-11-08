"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";
import { useRoleLabel } from "@/i18n/use-labels";
import { useWorkspace } from "@/providers/workspace-provider";

export function UserSummary() {
  const { user, primaryRole } = useWorkspace();
  const roleLabel = useRoleLabel();
  const t = useTranslations("shell");

  return (
    <div className="flex items-center gap-2.5 border-l border-line pl-3">
      <Avatar name={user.displayName} size="sm" />
      <div className="hidden min-w-0 md:block">
        <p className="truncate text-[13px] leading-tight font-medium text-ink">
          {user.displayName}
        </p>
        <p className="mt-0.5 truncate text-[11px] leading-tight text-ink-subtle">
          {roleLabel(primaryRole)}
        </p>
      </div>
      <form action={signOutAction}>
        <Button
          type="submit"
          variant="ghost"
          size="icon-sm"
          aria-label={t("signOut")}
          title={t("signOut")}
        >
          <LogOut aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}
