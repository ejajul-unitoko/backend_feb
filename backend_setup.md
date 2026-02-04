Below is a **very detailed, step-by-step documentation** for **Step 1 → Step 7** (Identity + Sessions + RBAC + Business membership + Request Context + Guards + Audit Logs). It’s written as a practical build guide you can follow in order.

I’ll assume **Postgres + Node/Express**, and a clean, modular backend.

---

# V0 Foundations Documentation (Step 1 → Step 7)

## Guiding principles (apply to everything)

### Naming + Columns (DB)

- Primary keys: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- Standard timestamps:
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - optional `deleted_at TIMESTAMPTZ NULL` (soft delete)

- Use `snake_case` in DB.
- Use constraints and indexes early (don’t “fix later”).
- Use `CHECK` constraints to prevent bad states.

### API + Code conventions

- `params`: `snake_case`
- `body/query/response`: `camelCase`
- One clear model for who’s calling:
  - appType: `uta|utb|utc|utd|public`
  - actorType: `admin|business_user|customer|rider|system`

- RBAC is mandatory: **every protected route requires permissions**.

---

# STEP 1 — USERS (Identity)

## Goal

A single table that can represent **all people** who use your ecosystem:

- Admin users (UTA)
- Business staff (UTB)
- Customers (UTC)
- Riders (UTD)

## 1.1 Create Postgres extension (required)

**Migration 001**

- Enable uuid generation:
  - `CREATE EXTENSION IF NOT EXISTS pgcrypto;`

> Without this, `gen_random_uuid()` won’t work.

## 1.2 Create the `users` table

**Migration 002** (conceptual schema)

### Required columns

- `id` UUID PK
- `name` TEXT
- `phone` TEXT NULL (unique)
- `email` TEXT NULL (unique)
- `password_hash` TEXT NULL
- `status` TEXT NOT NULL (active/disabled)
- `last_login_at` TIMESTAMPTZ NULL
- timestamps

### Recommended extra columns (helpful from day-1)

- `is_phone_verified` BOOLEAN default false
- `is_email_verified` BOOLEAN default false
- `avatar_url` TEXT NULL

### Constraints (very important)

- Unique constraints:
  - unique `phone` (where not null)
  - unique `email` (where not null)

- At least one identifier:
  - phone OR email must exist
    (via `CHECK (phone IS NOT NULL OR email IS NOT NULL)`)

### Indexes

- `users(phone)`
- `users(email)`
- `users(status)` (optional)

## 1.3 Password strategy

### If password-based login

- Store only `password_hash`, never raw password.
- Use **argon2** (preferred) or bcrypt.

### If OTP-based login (no passwords in V0)

- Allow `password_hash` to be NULL.
- Use the OTP system in Step 3.

## 1.4 User lifecycle rules

- `active`: normal user
- `disabled`: cannot login, existing sessions must be invalidated

## 1.5 Deliverables for Step 1

✅ DB migration(s) for users
✅ UserRepository (minimal) with:

- `findById(id)`
- `findByEmail(email)`
- `findByPhone(phone)`
- `createUser(data)`
- `updateUser(id, data)`
  ✅ Basic user model types (JS/TS)

---

# STEP 2 — SESSIONS (Login tickets / refresh tokens)

## Goal

When a user logs in, they get an access token + refresh token.
Refresh tokens must be revocable and auditable.

## 2.1 Decide session mode

### Recommended V0 setup

- Access token: short expiry (10–20 min)
- Refresh token: long expiry (7–30 days)
- Refresh token is stored in DB as a **hash**

## 2.2 Create `sessions` table

**Migration 003**

### Columns

- `id` UUID PK
- `user_id` UUID FK → `users(id)`
- `app_type` TEXT NOT NULL (`uta|utb|utc|utd`)
- `refresh_token_hash` TEXT NOT NULL
- `device_id` TEXT NULL
- `ip_address` TEXT NULL
- `user_agent` TEXT NULL
- `expires_at` TIMESTAMPTZ NOT NULL
- `revoked_at` TIMESTAMPTZ NULL
- timestamps

### Rules

- Refresh token is **one-way hashed** (like password).
- If user logs out: set `revoked_at = now()`.

### Indexes

- `(user_id, app_type)`
- `expires_at`
- `revoked_at` (optional)

## 2.3 Session lifecycle

### On login

1. validate credentials
2. create session row (store refresh token hash)
3. return:
   - access_token
   - refresh_token

### On refresh

1. client sends refresh token
2. hash it and match a session
3. verify:
   - not revoked
   - not expired

4. rotate refresh token (recommended):
   - update `refresh_token_hash`

5. return new access + refresh

### On logout

- revoke session (`revoked_at`)

### On disable user

- revoke all sessions for that user

## 2.4 Deliverables for Step 2

✅ sessions migration
✅ SessionRepository:

- `createSession(userId, appType, refreshHash, meta)`
- `findValidSessionByRefreshHash(refreshHash)`
- `revokeSession(sessionId)`
- `revokeAllSessionsForUser(userId)`
  ✅ AuthService login/refresh/logout endpoints (per scope or shared)

---

# STEP 3 — OTP SYSTEM (optional, but common)

## Goal

Allow login/verify via OTP for phone/email.

## 3.1 Create `otps` table

**Migration 004**

### Columns

- `id` UUID PK
- `channel` TEXT NOT NULL (sms/email/whatsapp)
- `purpose` TEXT NOT NULL (login/register/reset)
- `target` TEXT NOT NULL (phone/email)
- `code_hash` TEXT NOT NULL
- `expires_at` TIMESTAMPTZ NOT NULL
- `consumed_at` TIMESTAMPTZ NULL
- `attempt_count` INT NOT NULL DEFAULT 0
- timestamps

### Indexes

- `(target, purpose)`
- `expires_at`
- `consumed_at`

### Rules

- OTP can only be used once (`consumed_at`).
- Rate-limit OTP attempts per target.

## 3.2 OTP lifecycle

- Generate code → hash → store row
- Verify code:
  - check not expired
  - check not consumed
  - compare hash
  - mark consumed

## 3.3 Deliverables

✅ OTP service + repository
✅ OTP rate limit
✅ OTP verify hooks integrate into login/register flows

> If you’re password-only V0, you can skip Step 3 and add later.

---

# STEP 4 — RBAC (Roles & Permissions)

## Goal

Define “who can do what” across your scopes.
This must exist BEFORE writing feature routes.

## 4.1 Decide RBAC structure

- Permissions are strings like:
  - `markets:read`
  - `markets:write`
  - `orders:read`

- Roles are collections of permissions:
  - `super_admin`
  - `business_owner`
  - `customer`
  - `rider`

## 4.2 Create RBAC tables

**Migration 005**

### `roles`

- `id` UUID
- `name` TEXT NOT NULL
- `scope` TEXT NOT NULL (`uta|utb|utc|utd`)
- `description` TEXT NULL
- timestamps
- UNIQUE (`scope`, `name`)

### `permissions`

- `id` UUID
- `key` TEXT NOT NULL (e.g. `orders:read`)
- `scope` TEXT NOT NULL
- timestamps
- UNIQUE (`scope`, `key`)

### `role_permissions`

- `role_id` FK roles
- `permission_id` FK permissions
- UNIQUE (`role_id`, `permission_id`)

### `user_roles`

- `user_id` FK users
- `role_id` FK roles
- UNIQUE (`user_id`, `role_id`)

## 4.3 RBAC seed plan (must do)

Create seed script that inserts:

### UTA roles

- super_admin, ops_admin, kyc_admin, support_admin

### UTB roles

- business_owner, business_manager, business_staff

### UTC roles

- customer

### UTD roles

- rider

### Permissions baseline (V0)

- markets:read/write
- stores:read/write
- products:read/write
- inventory:read/write
- orders:read/write
- delivery_tasks:read/write
- kyc:read/write
- support:read/write
- payments:read/write (optional)

## 4.4 Permission checks rule

- Every protected endpoint declares required permission(s).
- Middleware blocks request if missing.

## 4.5 Deliverables

✅ RBAC migrations
✅ RBAC seed script
✅ RBAC repository/service:

- getUserPermissions(userId, scope)
- assignRole(userId, roleId)
- removeRole(userId, roleId)

---

# STEP 5 — BUSINESS MEMBERSHIP (Tenant mapping)

## Goal

For UTB, data must be scoped by **business_id** (tenant).
So we create business + mapping between user and business.

## 5.1 Create businesses table

**Migration 006**

### `businesses`

- `id` UUID PK
- `legal_name` TEXT NOT NULL
- `display_name` TEXT NULL
- `status` TEXT NOT NULL (active/disabled)
- timestamps

Indexes:

- `status`

## 5.2 Create mapping: `business_users`

### `business_users`

- `business_id` FK businesses
- `user_id` FK users
- `role_in_business` TEXT (owner/manager/staff) optional
- `is_primary` BOOLEAN default false
- timestamps
- UNIQUE (`business_id`, `user_id`)

Indexes:

- `user_id`
- `business_id`

## 5.3 Tenant rules (critical)

- UTB routes must resolve a **businessId** for the logged-in user.
- You can store active business selection in:
  - session metadata OR
  - `business_users.is_primary` OR
  - user profile (later)

V0 simplest:

- Each business user belongs to exactly **one** business.

## 5.4 Deliverables

✅ businesses + business_users migrations
✅ BusinessMembershipService:

- getBusinessForUser(userId)
- assertUserBelongsToBusiness(userId, businessId)

---

# STEP 6 — Request Context + Guards (Middleware)

## Goal

Every request carries a “context object” that tells the system:

- who is calling
- from which app
- which tenant (business)
- what permissions they have
- requestId for tracing

## 6.1 Define context shape

Example:

```js
req.context = {
  requestId,
  appType, // uta|utb|utc|utd|public
  actorType, // admin|business_user|customer|rider|system
  actorId, // userId
  businessId, // only if appType=utb
  permissions, // resolved from RBAC
};
```

## 6.2 Middleware order (always)

1. `requestId` middleware (create if missing)
2. `authenticate` (validate access token)
3. `resolveActor` (user record)
4. `resolveTenant` (businessId for UTB)
5. `resolvePermissions` (RBAC)
6. `authorize` (check permission)
7. controller

## 6.3 Guard middlewares (must have)

- `requireAuth` (blocks if no token)
- `requireAppType('utb')`
- `requirePermission('orders:read')`
- `requireBusiness()` (blocks if no businessId)

## 6.4 Deliverables

✅ requestContext middleware
✅ authenticate middleware
✅ authorization middleware helpers
✅ consistent errors:

- 401 unauthenticated
- 403 forbidden

---

# STEP 7 — Audit Logs (Diary)

## Goal

Record sensitive actions:

- admin approvals
- login/logout
- role changes
- later: order overrides, payouts, refunds

## 7.1 Create audit_logs table

**Migration 007**

### `audit_logs`

- `id` UUID PK
- `scope` TEXT NOT NULL (uta|utb|utc|utd)
- `actor_type` TEXT NOT NULL
- `actor_id` UUID NULL (system can be null)
- `entity_type` TEXT NOT NULL
- `entity_id` UUID NULL
- `action` TEXT NOT NULL
- `old_values` JSONB NULL
- `new_values` JSONB NULL
- `ip_address` TEXT NULL
- `user_agent` TEXT NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()

Indexes:

- `(scope, created_at)`
- `(entity_type, entity_id)`
- `(actor_type, actor_id)`

## 7.2 Audit log rules

- Log only high-signal events (avoid logging everything)
- Always include:
  - actor
  - action
  - entity
  - timestamp

## 7.3 Audit hook placement

- In services (not routes):
  - after successful state change

Example events:

- `AUTH_LOGIN_SUCCESS`
- `AUTH_LOGOUT`
- `RBAC_ROLE_ASSIGNED`
- `MARKET_CREATED`
- later: `ORDER_STATUS_CHANGED`

## 7.4 Deliverables

✅ audit_logs migration
✅ AuditLogService:

- `log({ scope, actor, entity, action, oldValues, newValues, meta })`

---

# Final Output After Step 1–7 (What “done” looks like)

You should be able to do all of this successfully:

✅ Create users
✅ Login and get tokens
✅ Refresh token works
✅ Logout revokes session
✅ Assign roles and permissions
✅ Guard routes by permission
✅ UTB requests know which business they belong to
✅ Audit logs are written for auth + admin actions

Only after this, start:

- Markets
- Store profiles
- Catalog
- Orders

---

If you want, I can give you **exact Postgres DDL** (ready-to-paste migrations) for Steps **1–7** in one shot, plus a **seed script** for RBAC roles/permissions + first admin user.
