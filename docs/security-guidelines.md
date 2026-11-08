# Security Guidelines

## 1. Overview

Security is a core requirement of the Restaurant SaaS platform.

The platform handles restaurant operational data, staff accounts, customer information, orders, and payment records.

All applications must follow consistent security practices to protect user accounts, prevent unauthorized access, and maintain organization and branch data isolation.

The `restaurant-platform-backend` repository is responsible for implementing shared database-level and server-side security controls.

## 2. Multi-Tenant Data Isolation

The platform must enforce strict isolation between restaurant organizations.

Requirements:

- Every organization-owned record must be associated with the correct organization.
- Branch-specific records must be associated with the correct branch.
- Users must only access organizations and branches they are authorized to use.
- The backend must validate organization and branch access for every protected operation.
- Database queries must not rely on frontend filtering to enforce tenant isolation.
- Row Level Security (RLS) must protect applicable database tables.
- Cross-organization access must be prevented even when a user manually changes request parameters.

A valid authenticated session does not automatically grant access to every organization's data.

## 3. Authentication

### 3.1 Staff Authentication

Staff authentication is required to access the POS application.

Requirements:

- Protected routes must require an authenticated staff session.
- Staff identity and organization membership must be validated.
- Session expiration and logout must be handled correctly.
- Sensitive operations must require valid authorization.
- Public customer QR sessions must never be treated as staff authentication.

### 3.2 Customer Authentication

Customer authentication is handled separately by the waitlist application.

Requirements:

- Customer accounts must remain separate from staff authorization.
- Customer sessions must not grant access to staff-only functionality.
- Customers must only access their own protected account and queue information.

The public ordering application supports guest ordering and must not require a customer account.

## 4. Authorization

The platform uses role-based access control combined with organization and branch assignments.

Requirements:

- Every protected operation must validate the authenticated identity.
- Every operation must validate the required permission.
- Branch-scoped operations must validate branch access.
- Organization-scoped operations must validate organization membership and permissions.
- Frontend permission checks must not replace backend authorization.
- Sensitive actions must be restricted to explicitly authorized roles.

Authorization must be enforced by backend services and database policies where applicable.

## 5. Supabase and Database Security

The backend repository owns database security configuration.

Requirements:

- Enable RLS on tables containing protected application data.
- Define policies based on authenticated identity, organization membership, role, and branch access.
- Never assume that a hidden frontend component provides data protection.
- Avoid exposing privileged database operations directly to clients.
- Validate inputs before executing database operations.
- Use database constraints to protect data integrity.
- Review RLS policies whenever tables or relationships change.

The Supabase service-role key must never be exposed in browser-side code.

## 6. API and Server-Side Security

All server-side operations must:

- Validate request data.
- Authenticate the caller where required.
- Authorize the requested operation.
- Validate organization and branch context.
- Return predictable error responses.
- Avoid exposing internal stack traces or sensitive implementation details.
- Prevent unauthorized modification of protected records.

Sensitive business rules must not exist exclusively in frontend code.

## 7. QR Code and Dining Session Security

Restaurant QR codes provide access to public ordering sessions, not staff accounts.

Requirements:

- Use cryptographically secure, unguessable session tokens.
- Store token hashes rather than raw tokens where applicable.
- Support token revocation and dining-session expiration.
- Reject orders submitted to closed, expired, or revoked sessions.
- Validate that the session belongs to the correct organization, branch, and table.
- Avoid exposing sensitive internal identifiers unnecessarily.
- Apply appropriate rate limiting to public ordering operations.

A QR code must not provide access to staff-only application routes or administrative operations.

## 8. Customer Data Protection

Customer information must only be accessible to authorized users and applications.

Requirements:

- Collect only information necessary for the relevant feature.
- Restrict customer account information to authorized operations.
- Restrict customers to their own protected records.
- Avoid exposing customer contact details to unrelated users.
- Avoid logging passwords, authentication tokens, or sensitive personal information.
- Apply appropriate retention and deletion rules when defined by the platform.

For optional GPS-based waitlist verification:

- Request location only when required for the operation.
- Perform distance validation on the server.
- Avoid persisting precise coordinates unless explicitly required and justified.
- Treat browser-provided GPS as a presence signal, not proof of physical identity.

## 9. Payment Security

The initial platform release supports **cash payments only**.

Requirements:

- Do not implement payment gateway integrations in the initial release.
- Do not collect or store card numbers, CVVs, or other card credentials.
- Record cash payment amounts and relevant transaction information.
- Validate that recorded payment amounts match the applicable order balance.
- Restrict payment recording, modification, and cancellation to authorized staff.
- Maintain appropriate records of payment status and transaction changes.
- Prevent an order from being marked as paid without an authorized payment operation.

Payment records must be associated with the correct organization, branch, and order.

Future payment methods may be introduced through a separately reviewed implementation.

## 10. Secrets and Environment Variables

Requirements:

- Never commit secrets, API keys, passwords, or private credentials.
- Keep local environment files out of version control.
- Provide an `.env.example` containing variable names and safe placeholder values only.
- Use server-side environment variables for privileged credentials.
- Never expose the Supabase service-role key to the browser.
- Rotate credentials if they are accidentally exposed.
- Use separate configuration for development, staging, and production.

## 11. Input Validation and Application Security

All applications must:

- Validate user input on the server.
- Treat client-submitted data as untrusted.
- Prevent unauthorized mass assignment of protected fields.
- Use safe database query patterns.
- Sanitize user-generated content where it is rendered.
- Protect against common web vulnerabilities, including XSS, CSRF where applicable, injection, and broken access control.
- Apply rate limits to sensitive or publicly accessible operations.

## 12. Real-Time Security

Real-time communication must follow the same authorization rules as normal application requests.

Requirements:

- Restrict subscriptions to authorized organization and branch data.
- Validate authorization for state-changing operations.
- Do not expose sensitive information through event payloads.
- Handle expired or revoked sessions appropriately.
- Reconcile client state with persisted database records after reconnection.

## 13. Logging and Auditing

Security-relevant operations should be logged where appropriate.

Examples include:

- Staff authentication events.
- Staff role and permission changes.
- Organization and branch configuration changes.
- Sensitive order modifications and cancellations.
- Payment recording and payment corrections.
- Administrative actions.

Logs must not contain passwords, raw authentication tokens, or unnecessary sensitive customer information.

Audit records should be protected against unauthorized modification.

## 14. Security Testing

Security testing must cover:

- Cross-organization data access attempts.
- Unauthorized branch access.
- Role and permission enforcement.
- RLS policy behavior.
- Protected route access.
- Public QR token validation and revocation.
- Closed dining-session order rejection.
- Unauthorized payment modifications.
- Real-time subscription isolation.
- Input validation and rate limiting.

Security checks must be included when introducing new modules or changing shared backend functionality.

## 15. Security Principles

- Deny access by default.
- Enforce authorization on the backend.
- Treat all client input as untrusted.
- Isolate organization and branch data.
- Keep privileged credentials server-side.
- Collect only necessary customer information.
- Protect public QR sessions.
- Maintain traceability for sensitive operations.
- Test security boundaries continuously.
