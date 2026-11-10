# Real-Time Communication and Kitchen Display System (KDS)

## 1. Overview

The Restaurant POS application uses real-time communication to keep restaurant operations synchronized across staff interfaces.

The primary use case is the Kitchen Display System (KDS), where kitchen staff need to receive incoming orders and see order updates without manually refreshing the page.

Real-time communication is also used for relevant queue and dining-session updates.

PostgreSQL remains the authoritative source of persisted data. Real-time events notify clients that data has changed; they do not replace database records.

## 2. KDS Architecture

KDS is a dedicated interface within the `restaurant-pos` application.

- It is not a separate application or repository.
- It uses the same staff authentication system as POS.
- Access is controlled by organization, branch, and staff permissions.
- Kitchen staff should see orders belonging only to their authorized branch.
- The interface should be optimized for kitchen displays and tablet-sized screens.

A dedicated route and layout should be used to provide a focused kitchen workflow without the standard POS navigation.

## 3. Order Workflow

The initial KDS workflow follows these stages:

1. **New:** An order has been submitted and is waiting for kitchen acknowledgment.
2. **Preparing:** Kitchen staff have started preparing the order.
3. **Ready:** The order is ready for collection or serving.
4. **Completed:** The order has been handed over or otherwise completed according to the restaurant's workflow.
5. **Cancelled:** The order has been cancelled by an authorized staff member.

The backend must define and validate permitted status transitions.

The frontend must not allow arbitrary status changes that violate the order workflow.

## 4. Real-Time Order Updates

When a new order is submitted:

1. The backend validates and persists the order.
2. The backend makes the order available to authorized POS clients.
3. The KDS receives notification of the new order.
4. The KDS retrieves or updates the corresponding order information.
5. Kitchen staff can begin processing the order.

When an order's status changes, authorized clients should receive the relevant update.

Real-time communication should support:

- New order notifications.
- Order status changes.
- Order item preparation updates, if item-level preparation is supported.
- Order cancellation notifications.

## 5. Data Consistency and Recovery

Real-time delivery is not guaranteed to be uninterrupted.

The application must:

- Load the current active orders from the backend when KDS opens.
- Reconnect when the real-time connection is interrupted.
- Refresh or reconcile order data after reconnecting.
- Avoid displaying duplicate orders when events are received more than once.
- Handle delayed or out-of-order events safely.
- Reflect the latest persisted order status.

Database state must always take precedence over potentially stale client state.

## 6. Access Control

KDS access must be restricted to authenticated staff with the appropriate permissions.

- Kitchen staff should have access to KDS functions required for preparation.
- Cashiers should not automatically receive kitchen-management permissions.
- Branch restrictions must be enforced by the backend.
- Real-time subscriptions must not expose another organization's or branch's data.
- Hiding unauthorized controls in the frontend is not sufficient authorization.

## 7. Performance and Usability

The KDS interface should:

- Display important order information clearly.
- Make new orders visually distinguishable.
- Provide clear preparation status indicators.
- Support continuous operation during restaurant business hours.
- Minimize unnecessary interaction.
- Remain usable on common kitchen display sizes.
- Provide clear connection and synchronization status.

Sound notifications may be added as an optional enhancement, subject to browser and device limitations.

## 8. Other Real-Time Use Cases

Real-time communication may also be used for:

- Queue entry and status updates.
- Dining-session status changes.
- Table availability changes.
- Relevant order updates in the cashier interface.

Each use case must define which users can subscribe to its events and which persisted records they are authorized to retrieve.

## 9. Implementation Principles

- PostgreSQL is the source of truth.
- Real-time events are notifications, not authoritative records.
- All subscriptions must respect tenant and branch isolation.
- Backend authorization must validate state-changing operations.
- Clients must recover safely from disconnections.
- Duplicate events must not produce duplicate business operations.
- KDS remains part of the POS repository.

## 10. Implemented Frontend (M4.4)

The first usable KDS frontend is implemented in this repository:

- `/kitchen` — active board with station selection, status counts, manual
  refresh, 45-second polling, stale-data handling, and item lifecycle actions.
- `/kitchen/history` — completed/cancelled history with branch-local date
  filters and a 31-day maximum window.
- `/kitchen/stations` — Owner/Admin/Manager station and routing configuration.

Current implementation notes:

- The KDS uses the standard authenticated application shell and a kitchen
  sub-navigation. A dedicated full-screen kitchen layout remains deferred.
- **Supabase Realtime subscriptions are not used yet.** `BLK-008` remains open.
  The M4.5 validation run confirmed the publication membership, replica identity,
  and branch-scoped RLS policies against a disposable PostgreSQL 18 cluster, but
  an actual Realtime server is unavailable without Docker/WSL, so event delivery,
  reconnect behavior, and branch/organization isolation remain unverified.
  Polling at 45 seconds is the supported fallback.
- The board and lifecycle actions use only M4.2/M4.3 RPCs. The frontend never
  queries kitchen ticket tables directly.
- Financial data is excluded from KDS responses and UI.
- See [`m4-4-kitchen-display.md`](./m4-4-kitchen-display.md) for the full
  integration and role matrix.
