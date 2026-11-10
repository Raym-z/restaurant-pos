"use client";

import { ArrowRightLeft, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import type { TableSummary } from "../contracts";
import { PosTableSelection } from "./pos-table-selection";

export function PosChangeTableDialog({
  tables,
  branchName,
  timezone,
  selectedTableId,
  currentTableLabel,
  hasCart,
  onConfirm,
}: {
  tables: readonly TableSummary[];
  branchName: string;
  timezone: string;
  selectedTableId: string;
  currentTableLabel: string;
  hasCart: boolean;
  onConfirm: (table: TableSummary) => void;
}) {
  const t = useTranslations("pos.ordering");
  const [open, setOpen] = useState(false);
  const [pendingTable, setPendingTable] = useState<TableSummary | null>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setPendingTable(null);
    }
  }

  function handleSelect(table: TableSummary) {
    if (table.tableId === selectedTableId) {
      return;
    }

    if (hasCart) {
      setPendingTable(table);
      return;
    }

    onConfirm(table);
    setOpen(false);
  }

  function handleConfirm() {
    if (!pendingTable) {
      return;
    }

    onConfirm(pendingTable);
    setPendingTable(null);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <ArrowRightLeft />
          {t("changeTable")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("changeTableTitle")}</DialogTitle>
          <DialogDescription>
            {t("changeTableDescription", { branch: branchName })}
          </DialogDescription>
        </DialogHeader>

        {pendingTable ? (
          <div className="space-y-3 rounded-lg border border-warning/25 bg-warning-soft/50 p-4 text-sm">
            <div className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
              <p className="text-ink">
                {t("changeTableCartWarning", { table: currentTableLabel })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="danger" size="sm" onClick={handleConfirm}>
                {t("changeTableConfirm", { table: pendingTable.label })}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setPendingTable(null)}>
                {t("changeTableCancel")}
              </Button>
            </div>
          </div>
        ) : null}

        <PosTableSelection
          tables={tables}
          branchName={branchName}
          timezone={timezone}
          selectedTableId={selectedTableId}
          onSelect={handleSelect}
        />

        <DialogFooter>
          <Button variant="secondary" onClick={() => handleOpenChange(false)}>
            {t("changeTableCancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
