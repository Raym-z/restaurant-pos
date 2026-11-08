import Link from "next/link";

import { Card } from "@/components/ui/card";
import type { Branch } from "@/features/branches/types";
import type { AttentionItem } from "../types";

export function AttentionList({ items, branches }: { items: AttentionItem[]; branches: Branch[] }) {
  const branchById = new Map(branches.map((branch) => [branch.id, branch]));

  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">Needs attention</h2>
        <Link href="/staff" className="text-sm font-medium text-brand hover:text-brand-strong">
          Staff
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">Nothing needs attention right now.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => {
            const branch = item.branchId ? branchById.get(item.branchId) : undefined;
            return (
              <li key={item.id} className="rounded-lg border border-line bg-surface-subtle p-3">
                <div className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className={[
                      "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                      item.tone === "warning"
                        ? "bg-warning-soft text-warning"
                        : "bg-info-soft text-info",
                    ].join(" ")}
                  >
                    {item.tone === "warning" ? "!" : "i"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                      {item.description}
                    </p>
                    {branch ? (
                      <p className="mt-1 text-xs font-medium text-ink-subtle">
                        {branch.name} · {branch.code}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
