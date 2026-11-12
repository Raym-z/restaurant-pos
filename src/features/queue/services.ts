import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getWorkspace } from "@/features/workspace/services";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  QueueListRequestSchema,
  QueueListResponseSchema,
  toQueueRpcParams,
  type QueueListRequest,
  type QueueListResponse,
} from "./contracts";
import { normalizeQueueError } from "./errors";
import type { QueueLoadResult, QueueViewerResult } from "./types";
import { resolveQueueViewerResult } from "./viewer";

type QueueClient = SupabaseClient<Database>;

function failure(error: unknown): QueueLoadResult<never> {
  return { ok: false, error: normalizeQueueError(error) };
}

function invalidResponse(): QueueLoadResult<never> {
  return {
    ok: false,
    error: {
      code: "INVALID_RESPONSE",
      message:
        "The queue service returned data that could not be verified. Refresh before continuing.",
      retryable: true,
    },
  };
}

async function loadQueueClient(): Promise<QueueClient> {
  return createSupabaseServerClient();
}

export async function getQueueViewer(): Promise<QueueViewerResult> {
  return resolveQueueViewerResult(await getWorkspace());
}

export async function loadQueue(
  input: QueueListRequest,
): Promise<QueueLoadResult<QueueListResponse>> {
  const request = QueueListRequestSchema.safeParse(input);
  if (!request.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "The queue request is invalid.",
        retryable: false,
      },
    };
  }

  const supabase = await loadQueueClient();
  const { data, error } = await supabase.rpc(
    "list_waitlist_entries",
    toQueueRpcParams(request.data),
  );

  if (error) {
    return failure(error);
  }

  const parsed = QueueListResponseSchema.safeParse(data);
  if (!parsed.success || parsed.data.branchId !== request.data.branchId) {
    return invalidResponse();
  }

  return { ok: true, data: parsed.data };
}
