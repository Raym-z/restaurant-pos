# M4.4 — Kitchen Display System Frontend

## 1. Scope

M4.4 connects the `restaurant-pos` application to the M4.1–M4.3 kitchen
backend. The KDS remains part of this application; it is not a separate
repository or application.

Implemented routes:

| Route               | Purpose                                                         |
| ------------------- | --------------------------------------------------------------- |
| `/kitchen`          | Active ticket board with station selection and item actions.     |
| `/kitchen/history`  | Bounded completed/cancelled ticket history.                     |
| `/kitchen/stations` | Station and menu-routing configuration for administrative roles. |

`/kitchen` is now an available navigation item. `/kitchen/history` and
`/kitchen/stations` are reached from the kitchen sub-navigation so the staff
sidebar stays focused.

## 2. Active board

The board uses the M4.3 read RPC
`public.list_kitchen_tickets(p_branch_id, p_station_id, p_statuses, p_limit,
p_offset, p_from, p_to)`.

- Default board statuses are `pending`, `preparing`, and `ready`.
- The board is ordered oldest-first, matching the backend
  `created_at asc, id asc` order.
- Tickets are grouped by aggregate status. Per-item state is shown separately.
- Status tiles show counts for the tickets loaded on the current page.
- Station selection includes all branch stations. Inactive stations remain
  selectable so their existing tickets stay reachable.
- Manual refresh re-requests the current station/page.
- Board pagination uses `pageSize`/`hasMore`/`nextOffset`; the client requests
  the next page explicitly.
- A failed refresh keeps the last successful board visible and shows a stale
  timestamp warning instead of discarding operational data.

No prices, subtotals, discounts, totals, currency, or payment data are requested,
parsed, or rendered. Response parsers strip unknown fields; financial fields are
explicitly excluded by backend contract tests.

## 3. Item lifecycle actions

The UI exposes only the backend-supported forward transitions:

| Item state  | Action       | RPC                                           |
| ----------- | ------------ | --------------------------------------------- |
| `pending`   | Start        | `public.start_kitchen_ticket_item(uuid)`      |
| `preparing` | Mark ready   | `public.mark_kitchen_ticket_item_ready(uuid)` |
| `ready`     | Complete     | `public.complete_kitchen_ticket_item(uuid)`   |

- `completed` and `cancelled` items have no action.
- Buttons are disabled while a transition is pending.
- A request guard rejects duplicate submissions for the same ticket item before
  React commits pending state.
- Successful transitions return to the first active-board page and re-read the
  board through `list_kitchen_tickets`, avoiding offset-pagination drift.
- Failed transitions show a localized error. An uncertain committed response
  refreshes the board before the user retries.
- The browser never writes kitchen tables directly; only the M4.2 RPCs are used.

## 4. Polling and consistency

Supabase Realtime is **not** used in this milestone.

- Active board polling interval: **45 seconds** (`KITCHEN_POLL_INTERVAL_MS`).
- Polling pauses while the document is hidden and refreshes when it becomes
  visible again.
- Overlapping requests are queued to the latest target; stale responses are
  discarded by request key.
- Monitoring refreshes only the board RPC, not the full workspace.
- `BLK-008` (Realtime delivery and branch-isolation verification) remains open.
  Polling is the supported fallback.

## 5. History

`/kitchen/history` calls `list_kitchen_tickets` with explicit
`completed`/`cancelled` statuses and a required date window.

- The default window is the last 7 branch-local calendar days.
- Both start and end dates are required when a user edits the filter.
- The maximum range is 31 days.
- Date filters are matched against the ticket **creation time** (`created_at`),
  not the completion or cancellation timestamp. The history screen states this
  explicitly, and each card shows the terminal timestamps separately. See
  `m4-5-kitchen-integration-validation.md` for the follow-up recommendation.
- Branch-local `00:00` boundaries are converted to UTC instants using the branch
  IANA timezone.
- History is a separate view from the active board and is read-only.
- An optional station filter and completed/cancelled status filter are supported.
- Invalid, reversed, missing, or oversized ranges render a localized validation
  message without calling the backend.

## 6. Station management

`/kitchen/stations` integrates the M4.3 station configuration RPCs:

| Operation                 | RPC                                                     |
| ------------------------- | ------------------------------------------------------- |
| List stations/routes      | `public.list_kitchen_stations(p_branch_id)`             |
| Create station            | `public.create_kitchen_station(...)`                    |
| Update name/description   | `public.update_kitchen_station(...)`                    |
| Deactivate                | `public.deactivate_kitchen_station(...)`                |
| Reactivate                | `public.reactivate_kitchen_station(...)`                |
| Add category route        | `public.add_kitchen_station_category_route(...)`        |
| Remove category route     | `public.remove_kitchen_station_category_route(...)`     |
| Add item route            | `public.add_kitchen_station_item_route(...)`            |
| Remove item route         | `public.remove_kitchen_station_item_route(...)`         |

Behavior exposed by the UI:

- Station names and descriptions can be edited.
- Category routes and item routes can be added or removed.
- Item routes take precedence over category routes.
- Routes cannot be added to an inactive station; existing routes can still be
  removed.
- Deactivation warns that new tickets stop routing to the station, existing
  tickets remain readable and completable, routes are preserved, and no
  retroactive rerouting occurs.
- Reactivation restores the existing routes for future tickets.
- There is no station-delete control because the backend has no delete RPC.

Station management is a separate administrative screen, not part of the
kitchen board controls.

## 7. Roles and authorization

| Surface                     | Owner | Admin | Manager | Cashier | Kitchen staff |
| --------------------------- | ----- | ----- | ------- | ------- | ------------- |
| Active board and history    | Yes   | Yes   | Yes     | No      | Yes           |
| Item lifecycle actions      | Yes   | Yes   | Yes     | No      | Yes           |
| Station configuration       | Yes   | Yes   | Yes     | No      | Read denied   |

The M4.3 backend denies Cashier access to all kitchen RPCs. The frontend follows
that backend contract even though an older planning matrix listed Cashier as a
KDS viewer. This is intentional and the backend remains authoritative.

Frontend role checks only control navigation and control visibility. Every RPC
validates the authenticated staff profile, organization, branch, and role.

## 8. Known limitations and deferred items

- Supabase Realtime delivery remains deferred pending `BLK-008` verification.
- Status counts reflect the currently loaded board page, because the backend has
  no separate count RPC.
- Station-specific staff assignment is not implemented; kitchen access remains
  branch-wide.
- There is no ticket priority, acknowledgement, recall/reopen, station transfer,
  kitchen-side cancellation, or station deletion.
- Route changes do not reroute existing tickets.
- An item routed only to an inactive station is unrouted and produces no ticket.
  Operators must review routing configuration when deactivating stations.
- Kitchen history becomes unreadable when the branch itself is deactivated,
  because backend kitchen authorization requires an active branch.
