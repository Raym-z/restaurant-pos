# Restaurant POS

A multi-tenant restaurant management and Point of Sale platform built for restaurant businesses operating across multiple branches.

## Overview

Restaurant POS is the staff-facing application used to manage restaurant operations from a centralized platform.

It provides restaurant owners and authorized employees with tools to manage their branches, menus, tables, orders, payments, and kitchen operations.

## Features

The application is planned to include:

- **Dashboard:** Overview of restaurant operations and business performance.
- **Organization Management:** Manage restaurant business information and branches.
- **Staff Management:** Manage employees, branch assignments, and permissions.
- **Menu Management:** Manage categories, menu items, variants, and modifiers.
- **Table Management:** Configure restaurant tables and generate customer QR codes.
- **Queue Management:** Manage customer waiting lists and queue operations.
- **Point of Sale:** Handle cashier operations and customer orders.
- **Billing and Payments:** Manage dining bills, payments, and refunds.
- **Kitchen Display System:** Monitor and manage incoming kitchen orders.
- **Reports:** Review restaurant performance and operational data.
- **Settings:** Configure branch-specific settings and business hours.

## Technology Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- TypeScript
- Tailwind CSS 4
- next-intl (Indonesian and English)
- Supabase
- PostgreSQL

## Platform Architecture

This application is part of a four-repository platform:

| Repository                    | Responsibility                             |
| ----------------------------- | ------------------------------------------ |
| `restaurant-pos`              | Staff-facing POS and KDS                   |
| `restaurant-ordering`         | Public customer QR ordering                |
| `restaurant-waitlist`         | Customer accounts and waiting lists        |
| `restaurant-platform-backend` | Shared database and backend infrastructure |

All applications share a centralized Supabase backend.

## Getting Started

### Prerequisites

- Node.js 20.9 or newer
- npm 10 or newer

### Local development

```bash
npm install
```

Create a local environment file from the example:

```bash
# macOS / Linux
cp .env.example .env.local

# PowerShell
Copy-Item .env.example .env.local
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects to the application shell at `/dashboard`.

Supabase configuration is intentionally not wired up yet. Do not add privileged keys to any `NEXT_PUBLIC_*` variable.

### Available scripts

| Command                | Purpose                                           |
| ---------------------- | ------------------------------------------------- |
| `npm run dev`          | Start the Next.js development server.             |
| `npm run build`        | Create a production build.                        |
| `npm run start`        | Run the production build.                         |
| `npm run lint`         | Run ESLint.                                       |
| `npm run lint:fix`     | Run ESLint with automatic fixes.                  |
| `npm run typecheck`    | Run strict TypeScript checks with `tsc --noEmit`. |
| `npm run format`       | Format the repository with Prettier.              |
| `npm run format:check` | Verify formatting without changing files.         |
| `npm run test`         | Run the automated regression tests.               |
| `npm run check`        | Run linting and type checking together.           |

## Project Structure

```text
src/
├── app/
│   ├── (app)/              # Authenticated application shell and module routes
│   ├── globals.css          # Tailwind import, design tokens, base styles
│   ├── layout.tsx           # Root layout, fonts, metadata
│   └── not-found.tsx        # Global 404
├── components/
│   ├── data-table/          # Reusable data table and pagination
│   ├── layout/              # App shell, sidebar, header, page patterns
│   ├── states/              # Loading, empty, error, unauthorized states
│   └── ui/                  # Design-system primitives
├── config/                  # Site and navigation configuration
├── i18n/                    # Locale config, dictionaries, formatting hooks
├── lib/
│   ├── mock/                # Temporary mock data for shell preview
│   ├── currency.ts          # Centralized currency configuration and formatting
│   ├── format.ts            # Locale-aware date and number helpers
│   └── utils.ts             # className utility
├── providers/               # Workspace context and shared state reducer
└── types/                   # Frontend view models (temporary until backend types exist)
```

## Application Foundation

Phase 1 (Project Foundation) and the shared portions of Phase 3 (Core Application Structure) are implemented:

- Responsive application shell with desktop sidebar, tablet/mobile slide-over navigation, and sticky header.
- Organization/branch context switcher backed by temporary mock data.
- Warm neutral design system with brand color, typography, spacing, elevation, and focus tokens.
- Reusable UI primitives for buttons, forms, cards, badges, tables, tabs, dialogs, sheets, dropdowns, and tooltips.
- Reusable page header, section, stack, stat card, data table, and pagination patterns.
- Loading, empty, error, and unauthorized state components.
- Module routes reserved for later roadmap phases.

### Intentional Phase 1 boundaries

- Supabase is not connected.
- Authentication and backend authorization are not implemented.
- The workspace provider uses `src/lib/mock/workspace.ts`; it must not be used for authorization decisions.
- Role-based navigation visibility is provisional and is a UX hint only.
- Database schemas, migrations, RLS policies, RPCs, and Edge Functions belong to `restaurant-platform-backend` and are not modified here.

The mock workspace exists so the shell can be reviewed before Phase 2. Replacing it with the authenticated staff session is the first step of authentication integration.

## Localization and Currency

The staff interface supports Indonesian (`id`, default) and English (`en`). The
language selector lives in the application header, and the preference is stored
in the `pos_locale` cookie without changing application URLs.

- Translation dictionaries live in `src/i18n/messages/`.
- Currency formatting is centralized in `src/lib/currency.ts`.
- IDR is the platform currency. Amounts are whole Rupiah and render as
  `Rp 25.000` in both interface languages.
- Dates, times, weekdays, and plain numbers follow the selected interface locale.
- Role and status identifiers stay language-neutral; only display labels are
  translated.

See [docs/localization.md](docs/localization.md) for the full architecture.

## Workspace State

`WorkspaceProvider` is the single source of truth for the mock organization,
current user, branches, and active branch. Branch create/edit screens mutate the
same collection consumed by the header switcher. The active branch selection is
persisted in `localStorage` for this mock phase.

Frontend branch selection is a UI preference only. It does not grant access;
backend authorization remains the security boundary.

## Shared Component Conventions

Feature developers should read [docs/frontend-conventions.md](docs/frontend-conventions.md) before adding screens. It documents:

- Folder and import conventions.
- Design token and styling rules.
- The standard page, form, table, and state recipes.
- Shared component APIs.
- Mock-data conventions.
- Client/server component boundaries.
- Navigation and role-visibility conventions.

The application shell is already provided by `src/app/(app)/layout.tsx`. Feature routes should not re-create sidebar, header, or page padding.

## Development Checks

Before opening a pull request, run:

```bash
npm run check
npm run test
npm run build
```

Automated regression tests cover menu edit locale safety, localized menu search,
the five-role navigation contract, and shared workspace/branch state. They run
with the Node.js test runner through `tsx`.

## Documentation

- [Product Overview](docs/product-overview.md)
- [Application Architecture](docs/application-architecture.md)
- [Implementation Roadmap](docs/implementation-roadmap.md)
- [Roles and Permissions](docs/roles-and-permissions.md)
- [Integration Contracts](docs/integration-contracts.md)
- [Real-Time Communication and KDS](docs/realtime-and-kds.md)
- [Security Guidelines](docs/security-guidelines.md)
- [Frontend Conventions](docs/frontend-conventions.md)
- [Localization and Currency](docs/localization.md)

## Project Status

Phase 1 foundation is complete and the shared application shell for Phase 3 is in place. Dashboard and management feature screens are the next implementation area, followed by authentication integration once backend contracts are finalized.
