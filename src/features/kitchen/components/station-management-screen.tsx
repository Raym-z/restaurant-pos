"use client";

import { ChefHat } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";

import type { KitchenMenuCatalog, KitchenStation } from "../contracts";
import type { StaffRole } from "@/types/roles";
import { KitchenStationCard } from "./kitchen-station-card";
import { StationFormDialog } from "./station-form-dialog";
import { KitchenTabs } from "./kitchen-tabs";

function sortStations(stations: KitchenStation[]): KitchenStation[] {
  return [...stations].sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
  );
}

export function StationManagementScreen({
  branchId,
  branchName,
  initialStations,
  catalog,
  roles,
}: {
  branchId: string;
  branchName: string;
  initialStations: KitchenStation[];
  catalog: KitchenMenuCatalog;
  roles: readonly StaffRole[];
}) {
  const t = useTranslations("kitchen.stations");
  const [stations, setStations] = useState(() => sortStations(initialStations));

  function handleUpdated(station: KitchenStation) {
    setStations((current) =>
      sortStations(
        current.some((entry) => entry.stationId === station.stationId)
          ? current.map((entry) => (entry.stationId === station.stationId ? station : entry))
          : [...current, station],
      ),
    );
  }

  return (
    <PageStack>
      <PageHeader
        title={t("title")}
        description={t("description", { branch: branchName })}
        eyebrow={t("eyebrow")}
        actions={<StationFormDialog mode="create" branchId={branchId} onSaved={handleUpdated} />}
      />

      <KitchenTabs canManageStations />

      <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-muted">
        {t("routingNote")}
      </p>

      {stations.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={<StationFormDialog mode="create" branchId={branchId} onSaved={handleUpdated} />}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {stations.map((station) => (
            <KitchenStationCard
              key={station.stationId}
              station={station}
              catalog={catalog}
              roles={roles}
              onUpdated={handleUpdated}
            />
          ))}
        </div>
      )}
    </PageStack>
  );
}
