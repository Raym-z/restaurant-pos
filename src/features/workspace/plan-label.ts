/**
 * Pure plan-label resolution for the workspace.
 *
 * Mirrors the original sequential lookup: only organization admins see a plan,
 * the plan name wins when it resolves, and the stored plan code is the fallback
 * when the plan row is unavailable.
 */
export interface SubscriptionPlanCode {
  plan_code: string;
}

export interface PlanName {
  code: string;
  name: string;
}

export function resolvePlanLabel(input: {
  isOrgAdmin: boolean;
  subscription: SubscriptionPlanCode | null;
  plans: readonly PlanName[];
}): string | null {
  const subscription = input.subscription;

  if (!input.isOrgAdmin || !subscription) {
    return null;
  }

  const plan = input.plans.find((candidate) => candidate.code === subscription.plan_code);
  return plan?.name ?? subscription.plan_code;
}
