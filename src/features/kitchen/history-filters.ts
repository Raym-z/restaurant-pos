import { UuidSchema } from "@/features/pos/contracts";

import type { KitchenHistoryStatus } from "./contracts";

export const KITCHEN_HISTORY_MAX_RANGE_DAYS = 31;
export const KITCHEN_HISTORY_DEFAULT_DAYS = 7;
export const KITCHEN_HISTORY_PAGE_SIZE = 25;

export type KitchenHistoryStatusFilter = "all" | KitchenHistoryStatus;

export interface KitchenHistoryFilters {
  fromDate: string;
  toDate: string;
  status: KitchenHistoryStatusFilter;
  stationId: string | null;
  page: number;
  fromInstant: string;
  toInstant: string;
  statuses: KitchenHistoryStatus[];
}

export type KitchenHistoryFilterErrorCode =
  | "MISSING_RANGE"
  | "INVALID_DATE"
  | "INVALID_RANGE"
  | "RANGE_TOO_LONG"
  | "INVALID_STATUS"
  | "INVALID_STATION";

export type KitchenHistoryFilterResult =
  | { ok: true; filters: KitchenHistoryFilters }
  | { ok: false; error: KitchenHistoryFilterErrorCode };

export interface KitchenHistorySearchParams {
  from?: string | string[];
  to?: string | string[];
  status?: string | string[];
  station?: string | string[];
  page?: string | string[];
}

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function dateOnlyFromParts(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${pad(month)}-${pad(day)}`;
}

function dateOnlyToUtc(dateOnly: string): number {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

export function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const candidate = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));

  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === (month ?? 1) - 1 &&
    candidate.getUTCDate() === day
  );
}

export function addDays(dateOnly: string, days: number): string {
  const date = new Date(dateOnlyToUtc(dateOnly) + days * 86_400_000);
  return dateOnlyFromParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function dayDifference(fromDate: string, toDate: string): number {
  return Math.round((dateOnlyToUtc(toDate) - dateOnlyToUtc(fromDate)) / 86_400_000);
}

function zonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = formatter.formatToParts(date);

  function read(type: Intl.DateTimeFormatPartTypes): number {
    return Number(parts.find((part) => part.type === type)?.value ?? 0);
  }

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  };
}

/**
 * Converts a branch-local calendar date at 00:00 to a precise UTC instant.
 * The offset is resolved through the branch IANA timezone rather than the
 * server's local timezone.
 */
export function startOfDayInTimeZone(dateOnly: string, timeZone: string): string {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const desired = Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1);
  let candidate = desired;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = zonedParts(new Date(candidate), timeZone);
    const renderedAsUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const difference = desired - renderedAsUtc;

    if (difference === 0) {
      break;
    }

    candidate += difference;
  }

  return new Date(candidate).toISOString();
}

export function todayDateOnly(now: Date, timeZone: string): string {
  const parts = zonedParts(now, timeZone);
  return dateOnlyFromParts(parts.year, parts.month, parts.day);
}

export function defaultKitchenHistoryRange(
  now: Date,
  timeZone: string,
): { fromDate: string; toDate: string } {
  const toDate = todayDateOnly(now, timeZone);
  return {
    fromDate: addDays(toDate, -(KITCHEN_HISTORY_DEFAULT_DAYS - 1)),
    toDate,
  };
}

function parsePage(value: string | undefined): number {
  if (!value) {
    return 1;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

export function parseKitchenHistoryFilters(
  input: KitchenHistorySearchParams,
  timeZone: string,
  now: Date = new Date(),
): KitchenHistoryFilterResult {
  const defaults = defaultKitchenHistoryRange(now, timeZone);
  const rawFrom = single(input.from)?.trim();
  const rawTo = single(input.to)?.trim();

  if ((rawFrom && !rawTo) || (!rawFrom && rawTo)) {
    return { ok: false, error: "MISSING_RANGE" };
  }

  const fromDate = rawFrom || defaults.fromDate;
  const toDate = rawTo || defaults.toDate;

  if (!isValidDateOnly(fromDate) || !isValidDateOnly(toDate)) {
    return { ok: false, error: "INVALID_DATE" };
  }

  if (fromDate > toDate) {
    return { ok: false, error: "INVALID_RANGE" };
  }

  if (dayDifference(fromDate, toDate) >= KITCHEN_HISTORY_MAX_RANGE_DAYS) {
    return { ok: false, error: "RANGE_TOO_LONG" };
  }

  const rawStatus = single(input.status)?.trim();
  let status: KitchenHistoryStatusFilter = "all";

  if (rawStatus) {
    if (rawStatus !== "all" && rawStatus !== "completed" && rawStatus !== "cancelled") {
      return { ok: false, error: "INVALID_STATUS" };
    }
    status = rawStatus;
  }

  const rawStation = single(input.station)?.trim();
  let stationId: string | null = null;

  if (rawStation) {
    const parsedStation = UuidSchema.safeParse(rawStation);
    if (!parsedStation.success) {
      return { ok: false, error: "INVALID_STATION" };
    }
    stationId = parsedStation.data;
  }

  return {
    ok: true,
    filters: {
      fromDate,
      toDate,
      status,
      stationId,
      page: parsePage(single(input.page)),
      fromInstant: startOfDayInTimeZone(fromDate, timeZone),
      toInstant: startOfDayInTimeZone(addDays(toDate, 1), timeZone),
      statuses: status === "all" ? ["completed", "cancelled"] : [status],
    },
  };
}

export interface KitchenHistoryHrefInput {
  fromDate: string;
  toDate: string;
  status: KitchenHistoryStatusFilter;
  stationId: string | null;
  page?: number;
}

export function kitchenHistoryHref(input: KitchenHistoryHrefInput): string {
  const params = new URLSearchParams();
  params.set("from", input.fromDate);
  params.set("to", input.toDate);

  if (input.status !== "all") {
    params.set("status", input.status);
  }
  if (input.stationId) {
    params.set("station", input.stationId);
  }
  if (input.page && input.page > 1) {
    params.set("page", String(input.page));
  }

  return `/kitchen/history?${params.toString()}`;
}
