import { RefreshCw, ShieldAlert, Store, WifiOff } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { signOutAction } from "../actions";

interface SessionStateScreenProps {
  variant: "no-active-staff" | "no-roles" | "no-branches" | "auth-unavailable" | "workspace-error";
  organizationName?: string;
  displayName?: string;
}

export async function SessionStateScreen({
  variant,
  organizationName,
  displayName,
}: SessionStateScreenProps) {
  const t = await getTranslations("auth.states");
  const tShell = await getTranslations("shell");

  const content = {
    "no-active-staff": {
      title: t("noActiveStaffTitle"),
      description: t("noActiveStaffDescription"),
      icon: ShieldAlert,
    },
    "no-roles": {
      title: t("noRolesTitle"),
      description: t("noRolesDescription"),
      icon: ShieldAlert,
    },
    "no-branches": {
      title: t("noBranchesTitle"),
      description: organizationName
        ? t("noBranchesDescription", { organization: organizationName })
        : t("noBranchesDescriptionGeneric"),
      icon: Store,
    },
    "auth-unavailable": {
      title: t("authUnavailableTitle"),
      description: t("authUnavailableDescription"),
      icon: WifiOff,
    },
    "workspace-error": {
      title: t("workspaceErrorTitle"),
      description: t("workspaceErrorDescription"),
      icon: WifiOff,
    },
  }[variant];

  const signOutButton = (
    <form action={signOutAction}>
      <Button type="submit" variant="secondary">
        {tShell("signOut")}
      </Button>
    </form>
  );

  const signInAgainButton = (
    <form action={signOutAction}>
      <Button type="submit" variant="secondary">
        {t("signInAgain")}
      </Button>
    </form>
  );

  const retryButton = (
    <Button asChild variant="secondary">
      <Link href="/dashboard">
        <RefreshCw aria-hidden="true" />
        {t("retry")}
      </Link>
    </Button>
  );

  const recoveryActions =
    variant === "auth-unavailable" || variant === "workspace-error" ? (
      <div className="flex flex-wrap items-center justify-center gap-2">
        {retryButton}
        {signInAgainButton}
      </div>
    ) : (
      signOutButton
    );

  return (
    <PageStack>
      <PageHeader
        title={t("title")}
        description={displayName ? t("signedInAs", { name: displayName }) : t("description")}
      />
      <Card className="p-4 sm:p-6">
        <EmptyState
          icon={content.icon}
          title={content.title}
          description={content.description}
          action={recoveryActions}
        />
      </Card>
    </PageStack>
  );
}
