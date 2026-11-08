# Application Architecture

## 1. Overview

The Restaurant POS application is a staff-facing web application within a multi-tenant restaurant SaaS platform.

It provides a centralized interface for restaurant owners and staff to manage daily operations across one or more branches.

The application follows a modular architecture, separating business features into distinct modules while sharing common infrastructure such as authentication, authorization, navigation, and API communication.

## 2. High-Level Architecture

The platform consists of four independent repositories:

| Repository                    | Responsibility                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `restaurant-pos`              | Staff-facing POS, restaurant management, and Kitchen Display System (KDS).                       |
| `restaurant-ordering`         | Public customer-facing QR ordering experience.                                                   |
| `restaurant-waitlist`         | Customer accounts and public waitlist experience.                                                |
| `restaurant-platform-backend` | Shared database, authentication policies, authorization logic, APIs, and backend infrastructure. |

Each repository has its own application code and deployment lifecycle.

All repositories communicate with the same Supabase project within each environment.

## 3. Application Modules

The POS application is divided into the following functional modules:

### 3.1 Dashboard

- Display operational summaries and key business metrics.
- Provide an overview of restaurant activity.
- Show relevant information based on the user's organization and branch access.

### 3.2 Organization Management

- Manage organization-level information.
- Configure organization settings.
- Manage access to branches within the organization.

### 3.3 Branch Management

- Create and manage restaurant branches.
- Configure branch-specific information and operating settings.
- Assign staff members to branches.

### 3.4 Staff Management

- Manage staff accounts and profiles.
- Assign roles and permissions.
- Control branch-level access.

### 3.5 Menu Management

- Create and manage menu categories and items.
- Configure prices, descriptions, and availability.
- Manage menu visibility and branch-specific settings where applicable.

### 3.6 Table Management

- Create and configure restaurant tables.
- Assign tables to branches.
- Generate and manage QR codes associated with dining sessions.

### 3.7 Point of Sale (POS)

- Create and manage customer orders.
- Add, remove, and modify order items.
- Process payments and order completion.
- Support the restaurant's cashier workflow.

### 3.8 Queue Management

- Monitor active waitlist entries.
- Manage queue status and customer check-ins.
- Call, seat, and complete queue entries.

### 3.9 Kitchen Display System (KDS)

- Display incoming orders for kitchen staff.
- Show order items and preparation status.
- Allow kitchen staff to update preparation progress.
- Receive relevant order updates in real time.

KDS is part of the POS application and uses a dedicated interface and route. It is not a separate repository.

### 3.10 Billing and Payments

- Manage subscription and billing information.
- Display payment status and transaction records.
- Enforce feature availability based on the organization's subscription.

### 3.11 Reports

- Display operational and business reports.
- Provide relevant sales and transaction summaries.
- Restrict report data according to organization and branch permissions.

### 3.12 Settings

- Manage application and organization preferences.
- Configure branch-specific settings.
- Provide access to relevant operational configurations.

## 4. Multi-Tenant Structure

The application follows an organization-based multi-tenant model.

The hierarchy is:

`Platform → Organization → Branch`

- A platform contains multiple restaurant organizations.
- An organization can operate multiple branches.
- Staff members belong to an organization and may be assigned access to one or more branches.
- Organization-level administrators can access permitted branches within their organization.
- Branch-level staff can only access branches assigned to them, subject to their permissions.

All organization and branch data must be isolated through backend authorization policies.

The frontend must not be treated as the security boundary.

## 5. Authentication and Authorization

The POS application is intended exclusively for authenticated restaurant staff.

- Staff must authenticate before accessing protected application routes.
- Public customer QR ordering must not grant access to the POS application.
- User permissions determine which modules and actions are available.
- Branch assignments determine which branch data a user can access.
- Authorization must be enforced by the backend, not solely by frontend route guards or UI visibility.

## 6. Backend Communication

The POS application communicates with the shared backend infrastructure through approved APIs, database access patterns, and Supabase services.

The `restaurant-platform-backend` repository is the single source of truth for:

- Database schema and migrations.
- Row Level Security (RLS) policies.
- Database functions and RPCs.
- Edge Functions and server-side business logic.
- Shared types and API contracts.

POS application code must follow the established backend contracts.

The POS repository must not independently introduce database migrations, modify shared RLS policies, or duplicate backend business rules.

## 7. Real-Time Communication

Real-time communication is used for operational features that require immediate updates.

Examples include:

- New orders appearing in KDS.
- Order preparation status changes.
- Queue status updates.
- Relevant changes to active dining sessions.

PostgreSQL remains the authoritative source of persisted application data. Real-time events are used to notify clients about changes, not as a replacement for persistent records.

## 8. Application Design Principles

The application should follow these principles:

- **Modularity:** Keep features separated into clear functional modules.
- **Separation of concerns:** Separate UI components, business logic, and data-access responsibilities.
- **Reusability:** Share common components and utilities where appropriate.
- **Security:** Enforce tenant isolation and authorization on the backend.
- **Consistency:** Maintain consistent navigation, layouts, interactions, and design patterns.
- **Maintainability:** Prefer readable, predictable implementations over unnecessary abstractions.
- **Reliability:** Handle loading, empty, success, and error states appropriately.

## 9. Architecture Constraints

- Do not combine customer-facing applications with the staff-facing POS application.
- Do not create a separate repository for KDS.
- Do not implement customer authentication as part of the POS staff authentication flow.
- Do not bypass backend authorization with frontend-only checks.
- Do not duplicate database schemas or migrations across repositories.
- Do not assume that a user has access to every branch within their organization.
- Do not treat real-time events as the authoritative source of persisted data.
