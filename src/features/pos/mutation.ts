import { normalizePosError } from "./errors";
import type { PosActionError } from "./types";

export interface RpcResponse {
  data: unknown;
  error: unknown;
}

export type MutationResolution<T> =
  | {
      status: "success";
      data: T;
      committed: true;
      shouldRevalidate: true;
    }
  | {
      status: "uncertain";
      error: PosActionError;
      committed: true;
      shouldRevalidate: true;
    }
  | {
      status: "failed";
      error: PosActionError;
      committed: false;
      shouldRevalidate: false;
    };

/**
 * Separates a failed transaction from a successful transaction whose response
 * could not be parsed.
 *
 * A response parsing failure after a successful RPC is uncertain, not failed:
 * the transaction may already be committed. Callers must revalidate persisted
 * state and must not automatically retry non-idempotent mutations.
 */
export function resolveMutationResponse<T>(
  response: RpcResponse,
  parse: (value: unknown) => T | null,
): MutationResolution<T> {
  if (response.error) {
    return {
      status: "failed",
      error: normalizePosError(response.error),
      committed: false,
      shouldRevalidate: false,
    };
  }

  const data = parse(response.data);
  if (data === null) {
    return {
      status: "uncertain",
      error: {
        code: "INVALID_RESPONSE",
        message:
          "The backend completed the request, but its response could not be read. Refresh and verify the result before retrying.",
        retryable: false,
      },
      committed: true,
      shouldRevalidate: true,
    };
  }

  return {
    status: "success",
    data,
    committed: true,
    shouldRevalidate: true,
  };
}
