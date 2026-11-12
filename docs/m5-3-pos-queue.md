# M5.3 — POS Waitlist Queue

**Status:** Implemented. Read-only staff queue connected to the approved M5.2 backend RPC.

**Date:** 2026-11-12

**Repository:** `restaurant-pos-m5`

**Route:** `/queue`

## 1. Scope

M5.3 replaces the `/queue` placeholder with a live active-queue view for the
selected branch. It is intentionally **read-only**:

- The only data source is `public.list_waitlist_entries(...)`.
- There is no direct `waitlist_entries` table access.
- Walk-in creation, call, seat, cancel, no-show, manual reorder, ETA, automatic
  no-show, and Realtime are not part of this milestone.
- Those write workflows require separate approved backend contracts and are not
  invented by the POS.

## 2. Backend integration

Source of truth:

- Backend migration `20261111090000_m5_waitlist_queue_read.sql`
- Backend contract `src/contracts/waitlist/rpc.ts`
- Backend decision record `docs/m5-2-a-waitlist-queue-read-access-contract.md`

Request mapping:

| POS field | RPC parameter |
| --- | --- |
| `branchId` | `p_branch_id` |
| `status` (`waiting` / `notified` / null) | `p_statuses` (`[status]` or null) |
| trimmed `search` | `p_search` (null when blank) |
| `limit` (default 50, max 100) | `p_limit` |
| `(page - 1) * limit` | `p_offset` |

The response is parsed with a semantic (non-strict) contract for:

`branchId`, `statuses`, `generatedAt`, `entries`, `pageSize`, `hasMore`,
`nextOffset`.

Unknown additive response fields are stripped before use rather than rejected.

Each entry contains:

`entryId`, `branchId`, `source`, `status`, `partySize`, `displayName`,
`contactPhone`, `contactPhoneMasked`, `joinedAt`, `notifiedAt`, `position`,
`elapsedMinutes`.

The parser also rejects entries from another branch or with a status outside the
effective status set.

## 3. Authorization and privacy

| Role | Queue access | Phone |
| --- | --- | --- |
| Owner | Read | Full, from backend |
| Admin | Read | Full, from backend |
| Manager | Read | Full, from backend |
| Cashier | Read-only | Masked by backend |
| Kitchen Staff | Denied | No data |

Frontend role checks only control navigation and UX messaging. The backend RPC
is the security boundary. Kitchen Staff opening `/queue` directly sees the
unauthorized state and receives no queue data.

The POS renders only `contactPhone` returned by the RPC. It never derives,
reconstructs, stores in hidden DOM, or exposes the full phone through tooltips or
copy actions.

## 4. Queue behavior

- Backend ordering is preserved. A defensive FIFO sort by `joinedAt` then
  `entryId` is used for display; `position` is never recalculated from the page.
- Status filters are `waiting`, `notified`, or both active statuses.
- Search is name-only, server-side, trimmed, and limited to 200 characters.
- Pagination is offset-based with 50 rows per page and a maximum of 100.
- Page 1 is the live active-queue snapshot. Later pages are explicit user
  navigation, are labelled as not live, and pause automatic polling.
- The displayed rows, snapshot time, page number, live/not-live label, and
  pagination controls all come from the last successfully applied response. A
  failed page navigation keeps the previous page labelled as itself rather than
  implying the requested page loaded; the same pagination controls retry it.
- Positions remain the backend's absolute active-queue positions under filters,
  search, and pagination.
- The page displays display name, party size, position, status, source, joined
  time, backend-provided elapsed minutes, and permitted phone value.
- The queue snapshot time (`generatedAt`) and automatic refresh interval are
  visible.

## 5. Polling and stale data

- Polling interval: 45 seconds.
- Automatic polling always refetches offset 0 (page 1) and replaces the live
  board. Offset pages are not treated as a consistent cross-request snapshot.
- Polling pauses while the document is hidden and refreshes on visibility.
- Polling pauses on explicitly requested later pages to preserve user-driven
  pagination; returning to the live queue resumes it.
- Overlapping requests are queued to the latest target; intermediate polls are
  discarded.
- Responses are rejected when the branch, status, search, or page target has
  changed.
- Manual refresh is available and refreshes the currently displayed page.
- A failed refresh keeps the last successful rows visible and shows a stale
  warning with the last snapshot `generatedAt`. A failed page navigation does
  not advance the displayed page or the live/not-live label; the requested page
  is still tracked so automatic polling stays paused until the user returns to
  page 1 or the retry succeeds.
- `QueueScreen` is keyed by `viewer.branchId`; a branch switch remounts the
  screen so previous-branch data is never displayed as current-branch data.

## 6. Error handling

The backend raises SQLSTATE `P0001` with the application code in `message`,
surfaced by raw PostgREST as HTTP 400. The POS matches on `message`, not on the
HTTP status.

Localized codes:

`AUTH_REQUIRED`, `PERMISSION_DENIED`, `ROLE_REQUIRED`, `BRANCH_NOT_FOUND`,
`BRANCH_ACCESS_DENIED`, `STAFF_NOT_ACTIVE`, `ORGANIZATION_NOT_OPERATIONAL`,
`SUBSCRIPTION_RESTRICTED`, `RESOURCE_CONFLICT`, `VALIDATION_ERROR`,
`RATE_LIMIT_EXCEEDED`, `NOT_FOUND`, `SERVICE_UNAVAILABLE`,
`INVALID_RESPONSE`, `WORKSPACE_NOT_READY`, `INTERNAL_ERROR`.

Unknown errors fall back to a safe generic message; raw database errors are not
shown.

## 7. Files

| Area | Files |
| --- | --- |
| Contracts | `src/features/queue/contracts.ts` |
| Service/action | `src/features/queue/services.ts`, `actions.ts` |
| Access/viewer | `src/features/queue/access.ts`, `viewer.ts` |
| Errors | `src/features/queue/errors.ts`, `use-queue-error-message.ts` |
| Polling/state | `src/features/queue/request-coordinator.ts`, `selectors.ts` |
| UI | `src/features/queue/components/`, `src/app/(app)/queue/page.tsx`, `loading.tsx` |
| Navigation | `src/config/navigation.ts` |
| Types | `src/lib/supabase/database.types.ts` |
| Translations | `src/i18n/messages/en.json`, `id.json`, `src/i18n/use-labels.ts` |
| Tests | `src/features/queue/__tests__/` |

## 8. Tests

The queue suite covers:

- request/response parsing and pagination bounds;
- phone projection differences between management and Cashier;
- cross-branch and status-set response rejection;
- FIFO display ordering with backend position preservation;
- status counts and filter detection, including page-scoped and filtered counts;
- display-state derivation for loading, empty, stale, and error;
- backend `generatedAt` snapshot usage for initial and refreshed data;
- polling interval, visibility pause, offset-0 polling, overlap prevention, and
  stale-response rejection;
- explicit-page polling pause and poll/navigation response keys;
- page-navigation state transitions, including failed navigation keeping the
  previous page and label, retry, stale-response rejection, and branch isolation;
- branch switching via request keys and branch-keyed route remount;
- role access for Owner/Admin/Manager/Cashier/Kitchen Staff;
- localized error coverage and EN/ID key parity;
- navigation availability and route wiring;
- absence of direct `waitlist_entries` table access;
- absence of hidden phone/copy/tooltip affordances.

## 9. Known limitations

- The screen is read-only because no write contract is approved in M5.3.
- Status counts are derived from the current page under the active filters and
  are labelled as page-scoped. They are never whole-queue totals because the
  backend does not return a total count. When a status filter is active, the
  excluded status badge is hidden rather than shown as a misleading zero.
- Automatic polling pauses on later pages to avoid replacing an explicitly
  requested page with the live snapshot. Returning to the live queue resumes
  polling.
- On a page beyond the current queue length, the UI offers a return to the first
  page rather than auto-clamping, avoiding a request loop.
- Realtime is not used; polling is the approved fallback.
- The hosted role-account acceptance matrix is outside this repository task.
