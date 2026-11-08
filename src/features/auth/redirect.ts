import { DEFAULT_AUTHENTICATED_PATH } from "@/features/workspace/constants";

/**
 * Accepts only same-origin absolute paths. External URLs, protocol-relative
 * paths, and backslash tricks fall back to the dashboard.
 */
export function safeNextPath(
  value: unknown,
  fallback: string = DEFAULT_AUTHENTICATED_PATH,
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const candidate = value.trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, "http://internal.local");
    if (parsed.origin !== "http://internal.local") {
      return fallback;
    }

    if (parsed.pathname === "/login" || parsed.pathname.startsWith("/login/")) {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
