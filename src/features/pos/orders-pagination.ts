export const ORDERS_PAGE_SIZE = 50;

export function parseOrdersPage(value: string | undefined): number {
  if (!value) {
    return 1;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function ordersPageOffset(page: number, pageSize = ORDERS_PAGE_SIZE): number {
  return (Math.max(1, page) - 1) * pageSize;
}

export function ordersPageHref({ page, status }: { page: number; status?: string | null }): string {
  const params = new URLSearchParams();
  if (page > 1) {
    params.set("page", String(page));
  }
  if (status) {
    params.set("status", status);
  }

  const query = params.toString();
  return query ? `/orders?${query}` : "/orders";
}
