# Security architecture

## Trust boundaries

Flutter and browsers are untrusted. They may hold the Supabase URL and publishable key, but never a Supabase secret/service-role key, database password, FCM server credential, or signing private key. FastAPI, controlled ingestion/jobs, and PostgreSQL form the trusted server boundary. External feeds, map responses, webhooks, uploads, and AI outputs are untrusted inputs.

## Authentication

Supabase Auth issues user access tokens. FastAPI verifies them with a maintained JWT library and the project's JWKS: signature/algorithm, issuer, audience, expiry/not-before, and subject. Keys are cached with bounded refresh. Sensitive operations can require recent authentication and session validation. Revocation expectations and short token lifetime must be documented because deleting a user alone does not instantly invalidate an issued token.

The API maps `sub` to an active `profiles` record. Authorization roles are assigned only by privileged backend/admin workflow and stored authoritatively in the database. Never trust `user_metadata`/`raw_user_meta_data` for authorization. If application metadata is used as a performance hint, account for stale JWTs and confirm sensitive authority against database state.

## Authorization and RLS

FastAPI applies deny-by-default role + ownership + state checks. PostgreSQL adds defense in depth:

- Enable RLS on every exposed table.
- Grant only required operations to `anon` and `authenticated`; grants and RLS are separate gates.
- Policies target roles explicitly and include row ownership/party predicates.
- UPDATE policies have SELECT visibility plus both `USING` and `WITH CHECK`.
- Test anonymous, each legitimate role, cross-tenant attempts, suspended users, stale roles, and privileged paths.
- Exposed views use `security_invoker` on supported PostgreSQL or are kept unexposed/revoked.
- Avoid security-definer functions. If unavoidable, place them in an unexposed schema, pin `search_path`, revoke PUBLIC execute, validate the actor, minimize privilege, and audit.

The Data API may require explicit exposure/grants for new tables depending on project configuration; Agent 5 must configure and test this rather than assuming public-schema defaults.

Admins cannot self-promote. Admin creation/role change is a separate audited server operation, protected by least privilege and preferably MFA/recent-auth step-up. High-risk actions require reason codes and audit events.

## Privileged keys and database access

Prefer current Supabase publishable keys for clients and secret keys for the rare server operations that truly require bypass. Legacy anon/service-role variables remain named only for compatibility. Secret/service-role access bypasses RLS and must be backend-only, stored in a secret manager, scoped by environment, rotated, and excluded from logs. Prefer a user-scoped token/connection whenever bypass is not required.

Direct database connections use TLS, separate least-privilege runtime/migration roles, bounded pools, and parameterized queries. Migrations do not run from public application clients.

## Input, upload, and AI safety

Use strict typed schemas, length/range/enum checks, canonical units, parameterized queries, output encoding, and allowlisted filter/sort fields. Rate-limit by route sensitivity, account, and network signal; return 429 with retry guidance.

Quality images use private buckets, randomized ownership-bound paths, short-lived signed upload/download URLs, MIME and magic-byte checks, size/dimension limits, malware scanning where available, metadata stripping, and retention rules. Never execute uploads. AI results are advisory, record model/version/confidence/limitations, and cannot claim laboratory properties from images.

## Transactions and integrity

Offer acceptance and payment callbacks are idempotent and transactional. Optimistic versions/locks prevent double selling. The backend calculates financial fields; clients cannot mass-assign them. Accepted order snapshots are immutable. Payment updates require trusted provider verification and replay protection. All status transitions use allowlisted state machines and append-only history.

## Privacy and PII

Collect minimum data, separate public display fields from private contact/location details, and limit precise farm/delivery locations to relevant parties. Encrypt transport and managed storage, redact logs, define retention/deletion procedures, and document consent/purpose for images and notifications. Audit access to sensitive data. Backups inherit access and retention controls.

## Logging and incident readiness

Structured security events include request/correlation ID, pseudonymous actor, action, resource, decision, source IP/device signal where lawful, and timestamp. Never log tokens, passwords, keys, complete payment details, or raw private images. Alert on repeated authorization failures, admin changes, bulk export, webhook failures, and unusual privileged-key use. Keep audit events append-only and access restricted.

## Secrets and configuration checklist

- Commit only `.env.example`; scan commits and CI output for secrets.
- Use separate development/demo/production projects and credentials.
- Never prefix server secrets with `NEXT_PUBLIC_` or compile them into Flutter.
- Restrict CORS to configured origins; do not treat CORS as authorization.
- Add secure browser headers and CSRF protection for cookie-based dashboard sessions.
- Pin dependencies and commit lockfiles when frameworks are initialized.
- Run database advisors, RLS tests, dependency scans, SAST, and authorization abuse tests before release.
