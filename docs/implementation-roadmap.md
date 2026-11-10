# Implementation Roadmap

## 1. Overview

This roadmap defines the recommended development sequence for the Restaurant POS application.

Development should proceed incrementally, prioritizing foundational infrastructure before implementing individual business modules.

Each phase should produce a functional and testable result before moving to the next phase.

## 2. Development Phases

### Phase 1: Project Foundation

Establish the application's technical foundation.

Tasks:

- Initialize the Next.js application.
- Configure TypeScript and Tailwind CSS.
- Establish the project folder structure.
- Configure environment variables.
- Set up shared layouts and global styles.
- Implement the initial design system.
- Configure linting and code formatting.
- Establish development and build scripts.

Expected outcome:

A functional application foundation with consistent styling, project conventions, and development tooling.

### Phase 2: Authentication and Access Control

Implement the staff authentication and authorization foundation.

Tasks:

- Integrate Supabase authentication.
- Implement staff login and logout.
- Implement protected application routes.
- Retrieve the authenticated user's organization and branch assignments.
- Implement role and permission handling.
- Establish organization and branch context switching where permitted.
- Handle expired sessions and unauthorized access.

Expected outcome:

Authenticated staff can access the application according to their assigned roles and permissions.

### Phase 3: Core Application Structure

Build the shared application interface and navigation.

Tasks:

- Implement the main application layout.
- Implement the sidebar and navigation.
- Create reusable page layouts and components.
- Implement organization and branch context indicators.
- Add loading, empty, error, and unauthorized states.
- Establish consistent form and table patterns.

Expected outcome:

A navigable application shell ready for individual business modules.

### Phase 4: Organization and Branch Management

Implement organization-level and branch-level administration.

Tasks:

- Organization profile and settings.
- Branch creation and management.
- Branch configuration.
- Staff assignment to branches.
- Organization and branch access validation.

Expected outcome:

Authorized administrators can configure their organization and manage its branches.

### Phase 5: Staff and Menu Management

Implement the foundational restaurant configuration modules.

Tasks:

- Staff management.
- Role assignment and permission configuration.
- Menu category management.
- Menu item management.
- Pricing and availability configuration.
- Branch-specific menu configuration where supported.

Expected outcome:

Restaurants can configure their staff and menus before processing orders.

### Phase 6: Table and Dining Session Management

Implement restaurant table operations and QR-based dining sessions.

Tasks:

- Table creation and management.
- Table status management.
- Dining session creation and closure.
- Secure session-specific QR token integration.
- QR generation and display.
- Session expiration and revocation handling.

Expected outcome:

Staff can manage tables and create secure customer ordering sessions.

### Phase 7: POS and Order Management

Implement the primary cashier workflow.

Tasks:

- Order creation and modification.
- Menu item selection.
- Table and dining session association.
- Order submission.
- Order status management.
- Cash payment recording.
- Cash received and change calculation.
- Payment status management.
- Order completion and cancellation workflows.

Expected outcome:

Cashiers can process restaurant orders from creation through completion, including cash payment recording.

**Initial payment scope:**

- Cash is the only supported payment method.
- The cashier records the amount received.
- The system calculates the change due.
- The payment is recorded against the corresponding order.
- No payment gateway, online payment, or card payment integration is included in the initial release.

### Phase 8: Kitchen Display System

Implement the kitchen-facing interface within the POS application.

Tasks:

- Dedicated KDS layout and route.
- Incoming order display.
- Order item preparation status.
- Real-time order updates.
- Preparation workflow.
- Reconnection and synchronization handling.

Expected outcome:

Kitchen staff can receive and process orders through a dedicated interface.

M4.4 status: the active board, ticket-item lifecycle actions, bounded history,
and station management are implemented with polling (`/kitchen`,
`/kitchen/history`, `/kitchen/stations`). Real-time subscriptions remain
deferred pending `BLK-008` verification. See
[`m4-4-kitchen-display.md`](./m4-4-kitchen-display.md).

### Phase 9: Waitlist and Queue Management

Integrate the customer-facing waitlist application.

Tasks:

- Display active queue entries.
- Customer check-in and arrival handling.
- Queue status management.
- Call and seat customers.
- Complete or cancel queue entries.
- Handle branch-specific queue operations.

Expected outcome:

Restaurant staff can manage customer queues from the POS application.

### Phase 10: Billing, Reports, and Settings

Implement operational administration and business insights.

Tasks:

- Subscription and billing interface.
- Subscription entitlement handling.
- Sales reports.
- Operational summaries.
- Organization and branch settings.

Expected outcome:

Authorized users can manage subscriptions, review business performance, and configure application settings.

### Phase 11: Testing and Production Readiness

Prepare the application for production deployment.

Tasks:

- Unit and integration testing.
- End-to-end testing of critical workflows.
- Multi-tenant isolation testing.
- Role and permission testing.
- Cash payment workflow testing.
- Real-time synchronization testing.
- Performance and responsive testing.
- Error handling and logging.
- Production environment configuration.
- Deployment verification.

Expected outcome:

A tested and production-ready POS application.

## 3. Development Guidelines

- Complete foundational phases before building dependent business modules.
- Prefer small, independently testable implementation tasks.
- Do not implement frontend features against undefined backend contracts.
- Coordinate database and backend changes through `restaurant-platform-backend`.
- Validate organization and branch access throughout development.
- Document important implementation decisions.
- Update this roadmap as priorities and technical requirements evolve.

## 4. Scope and Dependencies

The POS application depends on the other platform repositories for specific functionality:

| Dependency                    | POS responsibility                                                                 |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| `restaurant-platform-backend` | Consume approved backend services, database access patterns, and shared contracts. |
| `restaurant-ordering`         | Receive and manage orders created through public QR ordering.                      |
| `restaurant-waitlist`         | Manage customer queue operations from the staff interface.                         |

The POS application owns the staff-facing operational experience, including cashier workflows and KDS.
