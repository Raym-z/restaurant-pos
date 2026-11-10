# Frontend Conventions and Shared Component Guide

## 1. Purpose

This document is the handoff contract between the foundation work and feature implementation.

It defines the folder structure, design tokens, shared component APIs, page recipes, state handling, mock-data conventions, and boundaries that all POS screens should follow.

Read this before building dashboard or management screens. The application shell is already implemented; feature work should add page content rather than re-creating navigation, headers, or page padding.

## 2. Non-Negotiable Boundaries

- Supabase integration must use only public frontend credentials. Never add a service-role key, database password, or personal access token.
- Authentication and workspace reads use the server-side Supabase client. Do not scatter Supabase queries through presentation components.
- Do not create or modify database schemas, migrations, RLS policies, RPCs, or Edge Functions from this repository.
- Do not treat frontend role/scope filtering as security. Backend RLS and RPC authorization are the security boundary.
- Do not duplicate customer-facing ordering or waitlist features inside the POS.
- Do not modify shared shell, design tokens, or primitives without coordinating with the foundation owner.
- Do not commit directly to `main`.
- Do not present mock data as live backend data. Unconnected modules must render an explicit unavailable state.

See `docs/supabase-integration.md` for the M1 architecture.

## 3. Folder Structure

```text
src/
├── app/
│   ├── (app)/                  # Pages rendered inside the standard POS shell
│   │   ├── dashboard/
│   │   ├── pos/
│   │   ├── orders/
│   │   ├── tables/
│   │   ├── kitchen/
│   │   ├── queue/
│   │   ├── menu/
│   │   ├── staff/
│   │   ├── branches/
│   │   ├── reports/
│   │   ├── billing/
│   │   ├── settings/
│   │   ├── unauthorized/
│   │   ├── error.tsx
│   │   └── layout.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── not-found.tsx
│   └── page.tsx
├── components/
│   ├── data-table/             # DataTable, TablePagination
│   ├── layout/                 # App shell, sidebar, header, page patterns
│   ├── states/                 # Empty, loading, error, unauthorized
│   └── ui/                     # Design-system primitives
├── config/
│   ├── navigation.ts
│   └── site.ts
├── lib/
│   ├── mock/
│   ├── format.ts
│   └── utils.ts
├── providers/
│   └── workspace-provider.tsx
└── types/
    └── workspace.ts
```

### Import alias

Use the `@/*` alias for all application imports.

```tsx
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page";
import { cn } from "@/lib/utils";
```

Do not create barrel files per feature. Explicit imports make ownership and client boundaries clear.

## 4. Client and Server Components

- Route pages and layouts are Server Components by default.
- Add `"use client"` only to components that need state, effects, browser APIs, event handlers, or Radix primitives.
- The application shell, workspace provider, navigation, dropdowns, dialogs, sheets, tooltips, tabs, and interactive state components are already client components.
- Keep feature data-fetching and business logic separate from presentation components.
- `DataTable` is server-compatible. Its column `cell` functions run during server rendering. For row actions or client-side filtering, build a feature-specific `"use client"` wrapper around `DataTable`.

## 5. Styling and Design Tokens

Global tokens live in `src/app/globals.css` under Tailwind CSS 4's `@theme`.

### Core tokens

| Category  | Tailwind utilities                                                                 |
| --------- | ---------------------------------------------------------------------------------- |
| Surfaces  | `bg-canvas`, `bg-surface`, `bg-surface-subtle`, `bg-surface-muted`                 |
| Text      | `text-ink`, `text-ink-muted`, `text-ink-subtle`                                    |
| Borders   | `border-line`, `border-line-strong`                                                |
| Brand     | `bg-brand`, `bg-brand-soft`, `text-brand`, `text-brand-ink`                        |
| Feedback  | `success`, `warning`, `danger`, `info` and their `-soft` variants                  |
| Radius    | `rounded-lg` controls, `rounded-xl` cards and panels, `rounded-2xl` dialogs         |
| Elevation | `shadow-card`, `shadow-popover`                                                    |
| Fonts     | `font-sans` (Geist), `font-mono`                                                   |

Rules:

- Use tokens instead of raw hex values in components.
- Use `cn()` from `@/lib/utils` for every component that accepts `className`.
- Keep the primary action in `bg-brand`. Use warm accent tones only for secondary emphasis.
- Do not add dark mode variants yet. The application is light-theme only.
- Use `text-sm` for controls and body copy inside cards; reserve `text-2xl`/`text-[28px]` for page titles and metrics.
- Prefer borders and spacing over heavy shadows or decorative gradients.

### Typography

- Body: Geist Sans, 15px base, 24px line height.
- Page title: `text-2xl font-semibold tracking-tight sm:text-[28px]`.
- Card/section title: `text-base font-semibold tracking-tight`.
- Supporting copy: `text-sm leading-6 text-ink-muted`.
- Labels: `text-sm font-medium text-ink`.
- Uppercase section labels: `text-[11px] font-semibold tracking-[0.14em] uppercase text-ink-subtle`.

## 6. Standard Page Recipe

The shell provides the outer page container, maximum width, responsive padding, header, and navigation. Do not add another page-level container.

```tsx
import type { Metadata } from "next";

import { PageHeader, PageSection, PageStack } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Menu",
};

export default function MenuPage() {
  return (
    <PageStack>
      <PageHeader
        title="Menu"
        description="Manage categories, items, pricing, and availability."
        actions={<Button>Add category</Button>}
      />

      <PageSection
        title="Categories"
        description="Organize how the menu appears to staff and customers."
      >
        <Card>
          <CardHeader>
            <CardTitle>All categories</CardTitle>
          </CardHeader>
          <CardContent>{/* feature content */}</CardContent>
        </Card>
      </PageSection>
    </PageStack>
  );
}
```

Use `PageHeader` for every feature page. Use `PageSection` to group content. Use `PageStack` for consistent vertical rhythm.

## 7. Shared Component Catalog

### Layout and page patterns

| Component        | Import                        | Purpose                                                         |
| ---------------- | ----------------------------- | --------------------------------------------------------------- |
| `AppShell`       | `@/components/layout/app-shell` | Already applied in `(app)/layout.tsx`; do not re-create.       |
| `PageStack`      | `@/components/layout/page`    | Vertical page rhythm (`space-y-6`).                             |
| `PageHeader`     | `@/components/layout/page`    | Title, eyebrow, description, back link, and actions.            |
| `PageSection`    | `@/components/layout/page`    | Section heading, description, actions, and content.             |
| `ModulePlaceholder` | `@/components/layout/module-placeholder` | Temporary body for routes reserved for later phases.      |

`PageHeader` props: `title`, `description?`, `eyebrow?`, `actions?`, `backLink?: { href, label }`, `className?`.

### Actions

| Component | Import                    | Notes                                                                                       |
| --------- | ------------------------- | ------------------------------------------------------------------------------------------- |
| `Button`  | `@/components/ui/button`  | Variants: `primary`, `secondary`, `ghost`, `subtle`, `danger`, `link`. Sizes: `sm`, `md`, `lg`, `icon`, `icon-sm`. Supports `asChild` and `isLoading`. |

```tsx
<Button asChild variant="secondary" size="sm">
  <Link href="/branches">Manage branches</Link>
</Button>
```

`Button` defaults to `type="button"`. Set `type="submit"` explicitly inside forms. When using `asChild`, pass one child element.

### Forms

| Component     | Import                         | Notes                                                              |
| ------------- | ------------------------------ | ------------------------------------------------------------------ |
| `Input`       | `@/components/ui/input`        | Styled text input.                                                  |
| `Textarea`    | `@/components/ui/textarea`     | Styled multiline input.                                             |
| `Select`      | `@/components/ui/select`       | Native select with a consistent chevron.                            |
| `Checkbox`    | `@/components/ui/checkbox`     | Native checkbox using the brand accent.                             |
| `Label`       | `@/components/ui/label`        | Optional `required` indicator.                                      |
| `FormField`   | `@/components/ui/form-field`   | Label, control slot, description or error.                          |
| `FormGrid`    | `@/components/ui/form-field`   | Two-column responsive form grid.                                    |
| `FormSection` | `@/components/ui/form-field`   | Labeled form section with a side description on desktop.            |
| `FormActions` | `@/components/ui/form-field`   | Right-aligned form action row.                                      |

`react-hook-form`, `zod`, and `@hookform/resolvers` are installed for consistent form behavior. Client-side validation is for UX only; backend validation remains required.

`ajv` is a dev-only peer-resolution dependency required by the latest `@hookform/resolvers`; it is not used at runtime. Keep it while the resolver remains installed so `npm ci` stays reproducible.

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required."),
});

type FormValues = z.infer<typeof schema>;

export function CategoryForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  const error = form.formState.errors.name?.message;

  return (
    <form onSubmit={form.handleSubmit(() => undefined)} noValidate>
      <FormField label="Category name" htmlFor="category-name" error={error} required>
        <Input
          id="category-name"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "category-name-error" : undefined}
          {...form.register("name")}
        />
      </FormField>
    </form>
  );
}
```

`FormField` renders an error id as `${htmlFor}-error` and a description id as `${htmlFor}-description`. Wire `aria-describedby` and `aria-invalid` on the control yourself, as shown above, until a form library abstraction is introduced.

### Display and data

| Component                                   | Import                             | Notes                                                                    |
| ------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------ |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | `@/components/ui/card` | Standard surface container.                                    |
| `Badge`                                     | `@/components/ui/badge`            | Variants: `neutral`, `brand`, `accent`, `success`, `warning`, `danger`, `info`, `outline`. |
| `Avatar`                                    | `@/components/ui/avatar`           | Initials avatar; sizes `sm`, `md`, `lg`.                                  |
| `StatCard`                                  | `@/components/ui/stat-card`        | KPI card with optional icon, trend, description, and loading skeleton.    |
| `Skeleton`                                  | `@/components/ui/skeleton`         | Loading placeholder.                                                      |
| `Spinner`                                   | `@/components/ui/spinner`          | Inline accessible spinner.                                                |
| `Separator`                                 | `@/components/ui/separator`        | Horizontal or vertical divider.                                           |
| `SearchInput`                               | `@/components/ui/search-input`     | Search field with icon and screen-reader label.                           |

### Tables

| Component          | Import                                | Notes                                                                 |
| ------------------ | ------------------------------------- | --------------------------------------------------------------------- |
| `DataTable`        | `@/components/data-table/data-table`  | Generic, server-compatible table with loading and empty states.        |
| `TablePagination`  | `@/components/data-table/table-pagination` | Client pagination controls with `page`, `pageSize`, `total`, `onPageChange`. |
| Table primitives   | `@/components/ui/table`               | `TableContainer`, `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `TableFooter`, `TableCaption`. |

```tsx
import { DataTable, type DataTableColumn } from "@/components/data-table/data-table";

interface StaffRow {
  id: string;
  name: string;
  role: string;
}

const columns: DataTableColumn<StaffRow>[] = [
  { id: "name", header: "Name", cell: (row) => row.name },
  { id: "role", header: "Role", cell: (row) => row.role },
];

<DataTable
  data={rows}
  columns={columns}
  getRowKey={(row) => row.id}
  ariaLabel="Staff members"
  isLoading={isLoading}
  emptyState={<EmptyState title="No staff members" description="Invite a team member to get started." />}
/>
```

`DataTable` requires `ariaLabel` when no visible caption is provided. Wrap it in a card or panel with `overflow-hidden` so rounded corners clip the table correctly. For row-level actions, use a client feature wrapper or place accessible links/buttons inside cells.

### Overlays and navigation primitives

| Component                                                        | Import                            | Notes                                                |
| ---------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------- |
| `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`, `DialogTrigger` | `@/components/ui/dialog` | Accessible modal. Always include a `DialogTitle`.    |
| `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetClose`, `SheetTrigger` | `@/components/ui/sheet` | Left slide-over used by the mobile shell navigation. |
| `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuCheckboxItem`, `DropdownMenuShortcut` | `@/components/ui/dropdown-menu` | Use `asChild` on triggers.                    |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`                  | `@/components/ui/tabs`            | Segmented tabs for sub-views.                        |
| `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`  | `@/components/ui/tooltip`         | `TooltipProvider` is already mounted by `AppShell`.  |

## 8. Standard States

| State                 | Import                               | Use                                                                    |
| --------------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| `EmptyState`          | `@/components/states/empty-state`    | No records, first-run, or not-yet-connected sections.                   |
| `LoadingState`        | `@/components/states/loading-state`  | Inline or section-level loading.                                        |
| `PageLoading`         | `@/components/states/loading-state`  | Full page skeleton for client-rendered transitions.                     |
| `ErrorState`          | `@/components/states/error-state`    | Recoverable request failure with optional retry.                        |
| `UnauthorizedState`   | `@/components/states/unauthorized-state` | Missing role or branch access.                                      |

Handle loading, empty, success, and error states for every data-backed screen.

Route-level `loading.tsx` is currently not used. With the current Next.js static-route configuration it can leave the streamed loading fallback visible in the browser. Use `LoadingState` or `PageLoading` inside the relevant client section until this is revisited after a framework upgrade.

## 9. Navigation and Routes

Navigation is defined in `src/config/navigation.ts`.

To add a module:

1. Add a route under `src/app/(app)/<route>/page.tsx`.
2. Add a `metadata` title.
3. Add a `NavItem` with an icon, href, and provisional `roles`.
4. Replace or extend the placeholder body with the feature page.

Navigation sections are grouped as:

- **Operate:** Dashboard, Point of Sale, Orders, Tables, Kitchen Display, Queue.
- **Manage:** Menu, Staff, Branches.
- **Insights:** Reports.
- **Administer:** Billing, Settings.

Role visibility uses the five authoritative role identifiers from
`docs/roles-and-permissions.md`: `owner`, `admin`, `manager`, `cashier`, and
`kitchen_staff`. They are defined once in `src/types/roles.ts` and must stay
language-neutral. Navigation filtering is a provisional UX hint only. Backend
permission identifiers are not final; replace this filtering when the backend
authorization contract is available.

The Kitchen Display System currently uses the standard `(app)` shell with a
kitchen sub-navigation at `/kitchen`, `/kitchen/history`, and
`/kitchen/stations`. A dedicated full-screen layout outside the shell remains
deferred; coordinate before creating or changing that route group. See
`docs/m4-4-kitchen-display.md`.

## 10. Mock Data Conventions

Mock data exists only so screens can be developed before backend contracts are finalized.

- Place mock datasets in `src/lib/mock/<feature>.ts`.
- Name exports `mock<Feature>` (for example, `mockMenuCategories`).
- Type mock data with frontend view models in `src/types/<feature>.ts`.
- Keep values deterministic and realistic. Use ISO date strings, branch-scoped IDs, and the branch currency/timezone where relevant.
- Add a comment marking the file as temporary.
- Never use mock data for authorization decisions.
- Never copy database schema or RLS assumptions into frontend types. When backend shared types become available, replace these view models with the approved types.

The active shell workspace is seeded by `src/lib/mock/workspace.ts` and owned at
runtime by `WorkspaceProvider`, consumed through `useWorkspace()`. It provides:

```ts
const {
  organization,
  user,
  planLabel,
  branches,
  activeBranch,
  activeBranchId,
  setActiveBranch,
  updateOrganization,
  addBranch,
  updateBranch,
} = useWorkspace();
```

`WorkspaceProvider` is the single source of truth for organization, user,
branches, and the active branch. Feature providers such as `MockDataProvider`
own only feature data (staff and menu) and read organization/branches from this
context. Branch create/edit screens therefore update the same collection used by
the header switcher.

The active branch is persisted in `localStorage` under
`restaurant-pos.active-branch-id` for this mock phase. Branch switching is a UI
preference only. Every backend operation must still validate organization and
branch access.

## 11. Responsive Behavior

- The desktop sidebar is visible at `lg` (1024px and above).
- Below `lg`, navigation moves into the slide-over sheet and the header shows a menu button.
- The standard page container, maximum width, and responsive padding are provided by `AppShell`.
- Use `sm:` and `md:` for tablet refinements, not a separate tablet layout.
- Use `lg:` for desktop-only layout changes.
- Tables scroll horizontally through `TableContainer`; never force page-level horizontal overflow.
- Keep interactive targets at least 40px tall on touch screens.

## 12. Accessibility

- Use semantic headings and landmark elements.
- Every icon-only button needs an accessible label.
- Use `DataTable`'s `ariaLabel` or a visible caption.
- Always include a `DialogTitle` and `SheetTitle`.
- Use `FormField` with `htmlFor` and wire `aria-describedby`/`aria-invalid`.
- Do not attach click handlers to non-interactive elements without keyboard support.
- Preserve the global focus-visible outline; do not remove outlines without a visible replacement.
- Maintain sufficient text contrast; use the token palette instead of ad hoc colors.

## 13. Validation

Run before handing off work:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run format:check
```

Automated tests use the Node.js test runner through `tsx` and live beside the
modules they cover as `*.test.ts`. Fix issues introduced by your change. Do not
report a check as passing unless it was actually run.

## 14. Handoff Checklist for Feature Agents

1. Read `AGENTS.md`, `docs/application-architecture.md`, `docs/implementation-roadmap.md`, and this document.
2. Work inside the existing `(app)` shell; do not re-create layout, sidebar, or page padding.
3. Replace placeholder pages with `PageStack` + `PageHeader` + feature sections.
4. Reuse the primitives above before creating new components.
5. Add feature mock data under `src/lib/mock/` and temporary view models under `src/types/`.
6. Handle loading, empty, success, error, and unauthorized states.
7. Keep frontend role checks as UX only and document backend dependencies.
8. Run lint, typecheck, build, and formatting checks.
9. Coordinate before changing shared shell components, design tokens, navigation structure, authentication, or permissions.
