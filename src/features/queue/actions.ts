"use server";

import { QueueListRequestSchema, type QueueListRequest, type QueueListResponse } from "./contracts";
import { loadQueue } from "./services";
import type { QueueLoadResult } from "./types";

/**
 * Loads one queue page through the approved M5.2 read RPC. This action is
 * read-only; it performs no mutations and does not revalidate paths.
 */
export async function loadQueueAction(input: unknown): Promise<QueueLoadResult<QueueListResponse>> {
  const parsed = QueueListRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "The queue request is invalid.",
        retryable: false,
      },
    };
  }

  return loadQueue(parsed.data as QueueListRequest);
}
