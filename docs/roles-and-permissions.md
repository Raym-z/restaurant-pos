# Roles and Permissions

## 1. Overview

The Restaurant POS application uses role-based access control (RBAC) to determine which staff members can access application modules and perform specific operations.

Access is determined by:

- The user's organization membership.
- The user's assigned role.
- The user's permitted branches.
- The permissions associated with that role.

The backend is responsible for enforcing all authorization rules. Frontend route guards and UI visibility are supplementary controls only.

## 2. Access Hierarchy

The platform follows this hierarchy:

`Platform → Organization → Branch → Staff`

- Platform-level access applies to platform administration.
- Organization-level access applies to the restaurant business and its permitted branches.
- Branch-level access applies to individual restaurant locations.
- Staff permissions determine which actions a user can perform within their authorized scope.

A user must never gain access to another organization's data simply by changing an organization or branch identifier in a request.

## 3. Initial Staff Roles

The following roles are the initial recommended role templates.

### 3.1 Organization Owner

The organization owner has the highest level of access within their restaurant organization.

Responsibilities:

- Manage organization information and settings.
- Create and manage branches.
- Manage staff and assign roles.
- Access permitted branches.
- Manage menus and restaurant configurations.
- Access reports and business summaries.
- Manage subscription and billing settings.

### 3.2 Organization Administrator

The organization administrator manages day-to-day administration across authorized branches.

Responsibilities:

- Manage branch configurations.
- Manage staff and role assignments, subject to owner-level restrictions.
- Manage menus and restaurant settings.
- Access operational reports.
- Monitor restaurant operations.

The organization administrator does not automatically have ownership or subscription-management privileges.

### 3.3 Branch Manager

The branch manager oversees the operations of assigned branches.

Responsibilities:

- Manage branch-level settings.
- Manage assigned branch staff.
- Manage menus and table configurations for assigned branches.
- Monitor orders and queue activity.
- Access branch-level reports.
- Perform permitted cashier and operational actions.

Branch managers must not access other branches unless explicitly authorized.

### 3.4 Cashier

The cashier handles customer transactions and order processing.

Responsibilities:

- Create and manage orders.
- Associate orders with tables or dining sessions.
- Record cash payments.
- Complete or cancel orders according to assigned permissions.
- View relevant order and table information.
- Monitor order status.

Cashiers must not automatically have access to staff administration, subscription settings, or organization-wide reports.

### 3.5 Kitchen Staff

Kitchen staff use the Kitchen Display System to process incoming orders.

Responsibilities:

- View incoming orders for assigned branches.
- View order items and relevant preparation information.
- Update preparation status.
- Mark orders as ready when preparation is complete.

Kitchen staff should not automatically have access to cashier operations, payment records, staff management, or administrative settings.

### 3.6 Host / Queue Staff

Host or queue staff manage customer arrivals and the restaurant waitlist.

Responsibilities:

- View active queue entries for assigned branches.
- Register or check in customers where permitted.
- Call customers.
- Update queue status.
- Mark customers as seated or remove entries according to permitted workflows.

Queue staff should not automatically have access to financial reports or payment operations.

## 4. Permission Categories

Permissions should be defined around specific actions rather than relying only on broad role names.

| Category        | Example permissions                                      |
| --------------- | -------------------------------------------------------- |
| Organization    | View and update organization information                 |
| Branch          | View, create, update, and manage branches                |
| Staff           | View staff, invite staff, update roles, deactivate staff |
| Menu            | View, create, update, archive menu items and categories  |
| Tables          | View, create, update, and manage tables                  |
| Dining sessions | Create, view, close, and revoke sessions                 |
| Orders          | View, create, update, cancel, and complete orders        |
| Payments        | Record cash payments and view payment records            |
| KDS             | View orders and update preparation status                |
| Queue           | View, create, and update queue entries                   |
| Reports         | View organization-level or branch-level reports          |
| Billing         | View and manage subscription information                 |
| Settings        | View and update permitted application settings           |

The exact permission identifiers and their implementation must be defined centrally in `restaurant-platform-backend`.

## 5. Initial Role and Permission Matrix

The following matrix describes the intended default access model.

| Module                   | Owner | Org Admin | Branch Manager | Cashier | Kitchen | Host    |
| ------------------------ | ----- | --------- | -------------- | ------- | ------- | ------- |
| Organization settings    | Full  | Limited   | —              | —       | —       | —       |
| Branch management        | Full  | Manage    | Assigned       | —       | —       | —       |
| Staff management         | Full  | Manage    | Assigned       | —       | —       | —       |
| Menu management          | Full  | Manage    | Assigned       | View    | View    | —       |
| Table management         | Full  | Manage    | Assigned       | Operate | —       | —       |
| POS and orders           | Full  | Manage    | Manage         | Operate | View    | —       |
| Cash payments            | Full  | Manage    | Manage         | Record  | —       | —       |
| KDS                      | Full  | Manage    | Manage         | View    | Operate | —       |
| Queue management         | Full  | Manage    | Manage         | View    | —       | Operate |
| Reports                  | Full  | View      | Branch         | —       | —       | —       |
| Subscription and billing | Full  | —         | —              | —       | —       | —       |

**Legend:**

- Full: Full access within the user's authorized organization scope.
- Manage: Administrative access within the permitted scope.
- Operate: Perform normal operational actions.
- View: Read-only access.
- Branch: Access limited to assigned branches.
- Assigned: Access depends on the user's branch assignments.
- —: No default access.

This is an initial role template, not the final permission implementation. Exact permissions and exceptions must be defined before development.

## 6. Branch-Level Access

Staff may be assigned to one or more branches within their organization.

Requirements:

- Branch assignments must be stored and validated by the backend.
- Organization-level roles may have broader access according to their permissions.
- Branch-level roles must be restricted to their assigned branches.
- Switching branches must not bypass authorization.
- Reports and real-time subscriptions must respect the same branch restrictions.

## 7. Permission Enforcement

Authorization must be enforced at multiple levels:

1. **Frontend:** Hide unavailable navigation items and actions.
2. **Application layer:** Prevent unauthorized operations from being initiated.
3. **Backend:** Validate the user's identity, role, permissions, organization, and branch.
4. **Database:** Apply RLS policies to protect persisted records.

The backend and database are the security boundaries. Frontend checks must never be considered sufficient.

## 8. Role Management Principles

- Every staff member must belong to an organization.
- Staff access must be explicitly assigned.
- Roles must not grant access beyond the user's organization.
- Branch restrictions apply to all branch-scoped operations.
- Sensitive role changes must be restricted to authorized administrators.
- The organization owner must not be accidentally removed or left without an authorized ownership-transfer process.
- Permission changes must take effect on subsequent authorized operations.
- The backend must define how existing sessions respond to permission changes.

## 9. Future Considerations

The initial implementation should use the defined role templates.

Future enhancements may include:

- Custom roles.
- Granular permission configuration.
- Multiple roles per staff member.
- Temporary access assignments.
- Permission audit logs.
- More detailed approval workflows for sensitive operations.

These enhancements should not be assumed to be part of the initial release.
