"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  itemLabel,
}: TablePaginationProps) {
  const t = useTranslations("common");
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[13px] text-ink-muted">
        {t("showing", {
          start,
          end,
          total,
          itemLabel: itemLabel ?? t("items"),
        })}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft />
          {t("previous")}
        </Button>
        <span className="px-1 text-[13px] text-ink-muted">
          {t("pageOf", { page: currentPage, totalPages })}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          {t("next")}
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
