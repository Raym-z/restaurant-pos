import { DASHBOARD_RANGE_PRESETS, type DashboardRange, type DashboardRangePreset } from "./types";

interface LocalDate {
  year: number;
  month: number;
  day: number;
}

const DATE_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();
const OFFSET_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

function dateFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = DATE_FORMATTER_CACHE.get(timeZone);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  DATE_FORMATTER_CACHE.set(timeZone, formatter);
  return formatter;
}

function offsetFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = OFFSET_FORMATTER_CACHE.get(timeZone);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  OFFSET_FORMATTER_CACHE.set(timeZone, formatter);
  return formatter;
}

/** Resolves a usable IANA timezone, falling back to UTC for invalid input. */
export function resolveDashboardTimeZone(timeZone: string | null | undefined): string {
  const candidate = timeZone?.trim() || "UTC";

  try {
    dateFormatter(candidate).format(new Date("2026-01-01T00:00:00Z"));
    return candidate;
  } catch {
    return "UTC";
  }
}

function localDateParts(instant: Date, timeZone: string): LocalDate {
  const parts = dateFormatter(timeZone).formatToParts(instant);
  const values: Record<string, string> = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function addDays(date: LocalDate, days: number): LocalDate {
  const instant = new Date(Date.UTC(date.year, date.month - 1, date.day + days, 12, 0, 0));
  return {
    year: instant.getUTCFullYear(),
    month: instant.getUTCMonth() + 1,
    day: instant.getUTCDate(),
  };
}

function localDateString(date: LocalDate): string {
  return [
    String(date.year).padStart(4, "0"),
    String(date.month).padStart(2, "0"),
    String(date.day).padStart(2, "0"),
  ].join("-");
}

/**
 * Offset of the timezone at the given instant, in milliseconds east of UTC.
 * The two-step resolution handles daylight-saving transitions without a
 * timezone dependency.
 */
function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = offsetFormatter(timeZone).formatToParts(instant);
  const values: Record<string, string> = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour) === 24 ? 0 : Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );

  return asUtc - instant.getTime();
}

function localMidnightUtc(date: LocalDate, timeZone: string): Date {
  const target = Date.UTC(date.year, date.month - 1, date.day, 0, 0, 0);
  let timestamp = target - timeZoneOffsetMs(new Date(target), timeZone);
  timestamp = target - timeZoneOffsetMs(new Date(timestamp), timeZone);
  return new Date(timestamp);
}

export function parseDashboardRangePreset(
  value: string | string[] | null | undefined,
): DashboardRangePreset {
  const candidate = Array.isArray(value) ? value[0] : value;
  return DASHBOARD_RANGE_PRESETS.includes(candidate as DashboardRangePreset)
    ? (candidate as DashboardRangePreset)
    : "today";
}

export function buildDashboardRange(
  preset: DashboardRangePreset,
  timeZone: string,
  now: Date = new Date(),
): DashboardRange {
  const resolvedTimeZone = resolveDashboardTimeZone(timeZone);
  const today = localDateParts(now, resolvedTimeZone);
  const dayCount = preset === "today" ? 1 : preset === "7d" ? 7 : 30;
  const firstDay = addDays(today, -(dayCount - 1));
  const dayAfterLast = addDays(today, 1);

  return {
    preset,
    timezone: resolvedTimeZone,
    from: localMidnightUtc(firstDay, resolvedTimeZone).toISOString(),
    to: localMidnightUtc(dayAfterLast, resolvedTimeZone).toISOString(),
    fromLocalDate: localDateString(firstDay),
    toLocalDate: localDateString(today),
  };
}
