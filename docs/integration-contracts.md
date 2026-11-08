# Integration Contracts

## 1. Overview

This document defines the integration boundaries and communication responsibilities between the four repositories of the Restaurant SaaS platform.

The objective is to ensure that independently developed applications can communicate consistently without duplicating business logic or introducing conflicting data structures.

The `restaurant-platform-backend` repository is the central owner of shared backend contracts.

## 2. Repository Responsibilities

| Repository                    | Integration responsibility                                                    |
| ----------------------------- | ----------------------------------------------------------------------------- |
| `restaurant-pos`              | Staff operations, cashier workflows, KDS, and administrative interfaces.      |
| `restaurant-ordering`         | Public QR ordering and customer order submission.                             |
| `restaurant-waitlist`         | Customer accounts and public waitlist interactions.                           |
| `restaurant-platform-backend` | Shared database, authorization, server-side logic, and integration contracts. |

Each application must respect the ownership boundaries of the other repositories.

## 3. Shared Backend

All applications use the same Supabase project within each environment.

The backend repository owns:

- Database schema and migrations.
- Row Level Security policies.
- Database functions and RPCs.
- Edge Functions.
- Shared TypeScript types and data contracts.
- Authentication and authorization rules.
- Integration documentation.

Applications must use approved backend interfaces and must not independently redefine shared data structures.

## 4. Organization and Branch Context

Organization and branch identifiers are fundamental to the platform's data model.

Integration requirements:

- Every organization-owned operation must be associated with the appropriate organization.
- Branch-specific operations must include or resolve the relevant branch context.
- The backend must validate that the authenticated user has permission to access the requested organization and branch.
- Applications must not rely on client-provided identifiers as proof of authorization.
- Customer-facing applications must resolve restaurant and branch context through approved public-facing mechanisms.

The backend remains responsible for enforcing tenant isolation.

## 5. Authentication Boundaries

The platform has two distinct user categories:

### 5.1 Staff Identity

Used by the POS application.

- Staff must authenticate before accessing staff-only functionality.
- Staff access is associated with an organization and permitted branch assignments.
- Roles and permissions determine available operations.
- Public customer QR sessions must never grant staff access.

### 5.2 Customer Identity

Used by the waitlist application.

- Customers have a platform-wide customer identity.
- Customer accounts are independent of restaurant staff accounts.
- Customer authentication must not grant access to staff-only functionality.
- Customer access to queue information must be restricted to their own authorized records.

The ordering application supports guest ordering and does not require customers to create an account.

## 6. Cross-Application Integration

### 6.1 POS and Ordering

The POS and ordering applications share the order and dining-session domain.

Expected integration flow:

1. Staff creates or activates a dining session for a table.
2. The backend issues a secure session-specific QR token.
3. The ordering application resolves the token and displays the appropriate restaurant menu.
4. Customers submit orders through the ordering application.
5. The backend validates the dining session and persists the order.
6. The POS application retrieves or receives notification of the new order.
7. Staff and kitchen personnel process the order through POS and KDS.

Integration requirements:

- QR tokens must be unguessable and revocable.
- Raw QR tokens must not be stored as database values.
- Closed or expired sessions must reject new orders.
- Order submission must be idempotent.
- The backend must validate menu availability and pricing.
- The backend must enforce organization and branch ownership.

### 6.2 POS and Waitlist

The POS and waitlist applications share the queue domain.

Expected integration flow:

1. A customer opens the waitlist application for a specific branch.
2. The customer submits a queue entry.
3. The backend validates eligibility and creates the queue entry.
4. The POS application retrieves active queue entries for authorized staff.
5. Staff updates queue status through POS.
6. The customer-facing application reflects the updated queue status.

Integration requirements:

- Queue entries must be associated with the correct branch.
- Customer access must be restricted to their own queue records.
- Staff operations must be authorized by organization and branch permissions.
- Duplicate active queue entries for the same customer and branch must be prevented according to the agreed business rules.

### 6.3 POS and Backend

The POS application uses approved backend interfaces for:

- Authentication and session handling.
- Organization and branch access.
- Staff and permission management.
- Menu and table management.
- Dining sessions.
- Orders and cash payments.
- Queue operations.
- Reports and billing.
- Real-time notifications.

The backend must own sensitive business rules and authorization decisions.

## 7. API and Data Contract Requirements

Before an integration is implemented, its contract must define:

- Operation name and purpose.
- Request structure.
- Response structure.
- Authentication requirements.
- Organization and branch authorization requirements.
- Validation rules.
- Error codes and error response structure.
- Idempotency requirements, where applicable.
- Relevant real-time events, where applicable.

Shared contracts should use consistent naming, identifiers, timestamps, and error formats.

TypeScript types should be maintained in the backend repository or generated from an approved shared source.

Applications must not independently invent incompatible versions of shared types.

## 8. Real-Time Integration

Real-time communication may be used for:

- New orders.
- Order status changes.
- Kitchen preparation updates.
- Dining session changes.
- Queue status changes.

Requirements:

- Persisted database records remain authoritative.
- Real-time events should identify the affected resource.
- Events must not expose information to unauthorized organizations or branches.
- Clients must handle disconnections and reconnect safely.
- Clients must be able to retrieve the latest persisted state after reconnecting.
- Duplicate or delayed events must not corrupt application state.

## 9. Cash Payment Integration

The initial platform release supports cash payments only.

Payment workflow:

1. The cashier selects an order that is ready for payment.
2. The POS displays the outstanding order balance.
3. The cashier enters the amount of cash received.
4. The system validates the received amount.
5. The system calculates the change due.
6. The backend records the cash payment and updates the payment status.
7. The POS displays the payment result.

Integration requirements:

- Payment records must be associated with the correct order, organization, and branch.
- The backend must validate the order balance and payment amount.
- The backend must prevent unauthorized payment modifications.
- Payment recording must be protected against duplicate submissions.
- Payment status must be derived from persisted payment records and order balance.
- Payment corrections or cancellations must follow authorized workflows.

**Initial payment exclusions:**

- No payment gateway integration.
- No online payment processing.
- No credit or debit card payments.
- No e-wallet integration.
- No external payment provider APIs or webhooks.

Future payment methods may be considered separately without changing the initial release scope.

## 10. Error Handling

All applications should handle integration failures consistently.

Examples include:

- Unauthorized access.
- Invalid organization or branch context.
- Expired dining sessions.
- Invalid or revoked QR tokens.
- Unavailable menu items.
- Duplicate order submissions.
- Invalid queue operations.
- Invalid cash payment amounts.
- Duplicate payment submissions.
- Network or real-time connection failures.

Error responses should be predictable and must not expose sensitive internal implementation details.

## 11. Contract Change Management

Changes to shared contracts must be coordinated through `restaurant-platform-backend`.

Before changing an existing contract:

1. Identify all applications that consume it.
2. Document the proposed change.
3. Assess compatibility with existing consumers.
4. Update shared types and backend implementation.
5. Update affected applications.
6. Test the complete integration flow.

Breaking changes should be versioned or introduced through a coordinated migration strategy.

## 12. Integration Principles

- The backend is the source of truth for shared data and business rules.
- Each application owns its own user interface and application-specific logic.
- No application may bypass backend authorization.
- Shared database structures must not be duplicated across repositories.
- Cross-application communication must follow documented contracts.
- Real-time notifications must not replace persisted data.
- Integration changes must be coordinated and tested across affected repositories.
- Cash is the only supported payment method in the initial release.

## 13. Pending Contract Definitions

The following details must be formally defined during backend design:

- Exact API and RPC names.
- Request and response schemas.
- Standard error codes and response formats.
- Authentication and authorization implementation.
- Dining session token lifecycle.
- Order submission and idempotency mechanism.
- Queue status transitions and business rules.
- Cash payment recording and correction rules.
- Real-time event names and payload schemas.
- Shared TypeScript type distribution strategy.

These definitions must be documented before dependent application features are implemented.
