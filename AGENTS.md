# AGENTS.md — Restaurant POS

## 1. Project Overview

This repository contains the staff-facing Point of Sale (POS) application for a multi-tenant restaurant SaaS platform.

The application allows restaurant owners and authorized staff to manage their restaurant operations, including:

- Organization and branch management
- Staff and permissions management
- Menu and category management
- Table management
- QR code and dining session management
- Queue management
- Cashier and order management
- Billing and payments
- Reports and analytics
- Kitchen Display System (KDS)

The KDS is part of this application, not a separate application.

## 2. Platform Architecture

The platform consists of four separate repositories:

- `restaurant-pos`: Staff-facing POS application.
- `restaurant-ordering`: Public customer-facing QR ordering application.
- `restaurant-waitlist`: Customer accounts and waiting list application.
- `restaurant-platform-backend`: Shared Supabase backend and database infrastructure.

All applications use one shared Supabase project per environment.

The platform follows a multi-tenant structure:

- An organization represents a restaurant business or brand.
- An organization can have multiple branches.
- Each branch has its own operational data and configuration.

## 3. Technology Stack

The intended technology stack is:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL

Use the existing project configuration as the source of truth. Do not independently replace dependencies or introduce major architectural changes without justification.

## 4. Development Guidelines

- Use TypeScript throughout the application.
- Prefer reusable components and modular feature-based architecture.
- Keep business logic separate from presentation components.
- Avoid unnecessary code duplication.
- Use clear, descriptive naming conventions.
- Avoid using `any` unless absolutely necessary.
- Handle loading, empty, success, and error states.
- Build responsive interfaces suitable for desktop and tablet usage.
- Follow accessibility best practices.
- Keep components focused and maintainable.

## 5. Multi-Tenant Security

Security and tenant isolation are critical.

- Every organization and branch operation must respect the authenticated user's permissions.
- Organization owners and administrators may access multiple branches according to their permissions.
- Branch managers, cashiers, and kitchen staff must only access their assigned branches.
- Never rely solely on frontend filtering or hidden UI elements for authorization.
- All protected operations must be validated by the backend.
- Never expose Supabase service-role keys or other privileged credentials in frontend code.
- Never commit environment files containing secrets.

## 6. Backend Integration Rules

The `restaurant-platform-backend` repository is the single source of truth for:

- Database schema and migrations
- Row Level Security (RLS) policies
- Database functions and RPCs
- Supabase Edge Functions
- Shared database types
- Backend API and integration contracts

Do not independently create or modify database migrations, RLS policies, RPCs, or shared database schemas in this repository.

If a required backend capability does not exist, document the requirement and coordinate with the backend development process.

Do not invent database structures, API contracts, or permission rules.

## 7. Authentication and Permissions

- POS access is restricted to authenticated restaurant staff.
- Customer QR codes must never provide access to staff functionality.
- Organization and branch access must be determined by trusted backend authorization.
- Frontend permission checks are for user experience, not security enforcement.
- Follow the finalized backend authentication and authorization contracts.

## 8. Realtime and Data Consistency

- PostgreSQL is the source of truth.
- Supabase Realtime is used to deliver updates to the application.
- Handle duplicate, delayed, and missed events.
- Refresh or reconcile data when reconnecting.
- Do not rely exclusively on client-side state for important operational transactions.

## 9. Git and Collaboration

- Do not commit directly to `main`.
- Work on the branch assigned to your worktree.
- Keep commits focused and descriptive.
- Do not force-push or rewrite shared history without explicit approval.
- Coordinate before modifying shared components, authentication, permissions, or application configuration.
- Do not overwrite another agent's work.

## 10. Before Completing a Task

Always:

1. Summarize the implementation.
2. List the files modified or created.
3. Report any assumptions or backend dependencies.
4. Run relevant linting and type checks.
5. Run relevant tests.
6. Report the actual results of those checks.

Do not claim that a test or command passed unless it was actually executed.
