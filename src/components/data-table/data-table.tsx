import { EmptyState } from "@/components/states/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: "left" | "center" | "right";
}

interface DataTableProps<T> {
  data: readonly T[];
  columns: readonly DataTableColumn<T>[];
  getRowKey: (row: T) => string;
  /** Required for assistive technology when there is no visible caption. */
  ariaLabel: string;
  caption?: React.ReactNode;
  isLoading?: boolean;
  loadingRows?: number;
  emptyState?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const alignClasses = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

const skeletonWidths = ["w-32", "w-24", "w-40", "w-20", "w-28"];

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  ariaLabel,
  caption,
  isLoading = false,
  loadingRows = 5,
  emptyState,
  footer,
  className,
}: DataTableProps<T>) {
  const colCount = columns.length;

  return (
    <TableContainer className={className} aria-busy={isLoading || undefined}>
      <Table aria-label={caption ? undefined : ariaLabel}>
        {caption ? <TableCaption className="sr-only">{caption}</TableCaption> : null}
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className={cn(column.align && alignClasses[column.align], column.headerClassName)}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: loadingRows }).map((_, rowIndex) => (
              <TableRow key={`skeleton-${rowIndex}`}>
                {columns.map((column, columnIndex) => (
                  <TableCell key={column.id} className={column.className}>
                    <Skeleton
                      className={cn(
                        "h-4",
                        skeletonWidths[(rowIndex + columnIndex) % skeletonWidths.length],
                      )}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={colCount} className="p-0">
                {emptyState ?? (
                  <EmptyState
                    bordered={false}
                    compact
                    title="No records yet"
                    description="Records will appear here once they are created."
                  />
                )}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={getRowKey(row)}>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(column.align && alignClasses[column.align], column.className)}
                  >
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
        {footer ? (
          <TableFooter>
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={colCount}>{footer}</TableCell>
            </TableRow>
          </TableFooter>
        ) : null}
      </Table>
    </TableContainer>
  );
}
