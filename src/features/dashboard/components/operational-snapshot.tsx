import { Card } from "@/components/ui/card";
import { formatNumber } from "@/features/shared/format";
import type { OperationalSnapshot as OperationalSnapshotData } from "../types";

export function OperationalSnapshot({ snapshot }: { snapshot: OperationalSnapshotData }) {
  const seatedRatio = snapshot.tablesTotal > 0 ? snapshot.tablesSeated / snapshot.tablesTotal : 0;

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-ink">Operations now</h2>
      <p className="text-sm text-ink-muted">Across the open branches</p>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-surface-subtle p-3">
          <dt className="text-xs font-medium text-ink-subtle">Kitchen orders</dt>
          <dd className="mt-1 text-xl font-semibold text-ink">
            {formatNumber(snapshot.kitchenOpenOrders)}
          </dd>
        </div>
        <div className="rounded-lg bg-surface-subtle p-3">
          <dt className="text-xs font-medium text-ink-subtle">Guests waiting</dt>
          <dd className="mt-1 text-xl font-semibold text-ink">
            {formatNumber(snapshot.guestsWaiting)}
          </dd>
        </div>
        <div className="rounded-lg bg-surface-subtle p-3">
          <dt className="text-xs font-medium text-ink-subtle">Staff on shift</dt>
          <dd className="mt-1 text-xl font-semibold text-ink">
            {formatNumber(snapshot.staffOnShift)}
          </dd>
        </div>
        <div className="rounded-lg bg-surface-subtle p-3">
          <dt className="text-xs font-medium text-ink-subtle">Tables seated</dt>
          <dd className="mt-1 text-xl font-semibold text-ink">
            {formatNumber(snapshot.tablesSeated)}
            <span className="text-sm font-normal text-ink-subtle">
              {" "}
              / {formatNumber(snapshot.tablesTotal)}
            </span>
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-ink-subtle">
          <span>Seating occupancy</span>
          <span>{Math.round(seatedRatio * 100)}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-brand"
            style={{ width: `${Math.round(seatedRatio * 100)}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
