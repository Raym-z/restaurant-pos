import { DEFAULT_AUTHENTICATED_PATH } from "@/features/workspace/constants";

const INTERNAL_ORIGIN = "http://internal.local";

function decodeRepeatedly(value: string): string | null {
  let decoded = value;

  for (let pass = 0; pass < 5; pass += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) {
        return decoded;
      }
      decoded = next;
    } catch {
      return null;
    }
  }

  return decoded;
}

function hasDotSegments(path: string): boolean {
  const pathPart = path.split(/[?#]/, 1)[0] ?? "";
  return pathPart.split("/").some((segment) => segment === "." || segment === "..");
}

function isUnsafePath(path: string): boolean {
  return (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(path) ||
    hasDotSegments(path)
  );
}

/**
 * Accepts only normalized, same-origin paths.
 *
 * Validation is performed on both the original and repeatedly decoded path so
 * encoded dot segments, encoded slashes, and normalization tricks cannot turn a
 * relative destination into a protocol-relative or external redirect.
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

  const decodedCandidate = decodeRepeatedly(candidate);
  if (!decodedCandidate || isUnsafePath(decodedCandidate)) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, INTERNAL_ORIGIN);
    if (parsed.origin !== INTERNAL_ORIGIN) {
      return fallback;
    }

    if (isUnsafePath(parsed.pathname)) {
      return fallback;
    }

    const decodedPathname = decodeRepeatedly(parsed.pathname);
    if (!decodedPathname || isUnsafePath(decodedPathname)) {
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
