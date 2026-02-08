# Backend Context & Database Schema

**Tech Stack:** Node.js, Express, PostgreSQL (Raw SQL).
**Architecture:** Service-Repository pattern.
**Database Management:** Raw SQL migrations in `./migrations/`.

This document provides a detailed overview of the existing database schema and the application logic flow for each table. This is intended to provide full context on the current system state.

---

## 1. Core Identity (`users`)

**Migration File:** `migrations/002_create_users_table.sql`

### Schema
```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Identity
    name TEXT,
    phone TEXT UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT,
    
    -- Status & Flags
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'pending')),
    is_phone_verified BOOLEAN DEFAULT false,
    is_email_verified BOOLEAN DEFAULT false,
    
    -- Profile
    avatar_url TEXT,
    last_login_at TIMESTAMPTZ,
    
    -- Standard Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL,

    CONSTRAINT users_phone_or_email_required CHECK (phone IS NOT NULL OR email IS NOT NULL)
);
```

### Logic & Flow (`AuthService.js`)
*   **User Creation:**
    *   **Registration:** A user entry is created with `status: 'pending'` when they first request an OTP for registration.
    *   **Activation:** Upon successful OTP verification, `status` becomes `'active'` and `is_email_verified` becomes `true`.
*   **Authentication:**
    *   **Password:** Users can set a password (`password_hash`) and login via email/password.
    *   **OTP Login:** Supported for password-less entry (especially for `utd` rider app).
*   **Profile:** Users can update their `name` and `avatar_url` (via Media service) progressively.

---

## 2. Authentication & Sessions (`sessions`)

**Migration File:** `migrations/003_create_sessions_table.sql`

### Schema
```sql
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session Context
    app_type TEXT NOT NULL, -- uta, utb, utc, utd
    refresh_token_hash TEXT NOT NULL,
    
    -- Device Metadata
    device_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    
    -- Lifecycle
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Logic & Flow (`AuthService.js`, `SessionRepository.js`)
*   **Token Strategy:** Uses short-lived JWT Access Tokens (15m) and long-lived Refresh Tokens (7 days).
*   **Login:** Creates a new row in this table. The `refresh_token` returned to the client is **hashed** before storage (`refresh_token_hash`).
*   **Token Rotation:** Calling `/refresh` validates the old token hash, revokes the old session (or updates it), and issues a new pair.
*   **Security:** Sessions are scoped by `app_type`. A login on the Customer App (UTC) does not authorize the Admin Panel (UTA).

---

## 3. RBAC System (`roles`, `permissions`, ...)

**Migration File:** `migrations/005_setup_rbac.sql`

### Schema
```sql
-- 1. Roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,  -- e.g., 'super_admin', 'customer', 'rider'
    scope TEXT NOT NULL, -- 'uta', 'utb', 'utc', 'utd'
    description TEXT,
    UNIQUE(scope, name)
);

-- 2. Permissions
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL,  -- e.g., 'orders:create', 'reports:view'
    scope TEXT NOT NULL,
    description TEXT,
    UNIQUE(scope, slug)
);

-- 3. Mappings
CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    PRIMARY KEY (user_id, role_id)
);
```

### Logic & Flow (`RbacRepository.js`)
*   **Scoping:** Every role and permission belongs to a specific `scope` (App).
*   **Default Assignment:**
    *   **UTC (Customer):** Automatically assigned `customer` role on registration.
    *   **UTD (Rider):** Automatically assigned `rider` role.
    *   **UTB (Business):** Automatically assigned `business_owner` role.
*   **Enforcement:** Middleware `requirePermission('slug')` checks if the user's role has the required permission mapping.

---

## 4. OTP Management (`otps`)

**Migration File:** `migrations/006_setup_otp.sql`

### Schema
```sql
CREATE TABLE IF NOT EXISTS otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target TEXT NOT NULL,         -- Email address
    target_type TEXT NOT NULL DEFAULT 'email',
    purpose TEXT NOT NULL,        -- 'register', 'login', 'reset', 'admin_request'
    scope TEXT NOT NULL,          -- 'uta', 'utb', 'utc', 'utd'
    code_hash TEXT NOT NULL,
    
    -- Security
    attempt_count INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Logic & Flow (`OtpService.js`)
*   **Lifecycle:**
    1.  **Generate:** A 6-digit code is generated. The hash is stored in DB. The raw code is returned ONLY to the email service.
    2.  **Verify:** User submits code. System hashes input and compares with DB. Checks `expires_at` (10m) and `consumed_at` (must be null).
*   **Security:** Tracks `attempt_count` to prevent brute-force (Limit: 5).

---

## 5. Admin Workflows (`admin_access_requests`)

**Migration File:** `migrations/006_setup_otp.sql`

### Schema
```sql
CREATE TABLE IF NOT EXISTS admin_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Context
    scope TEXT NOT NULL DEFAULT 'uta',
    request_context JSONB,
    
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id), -- Super Admin ID
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Logic & Flow (`AuthService.js` - Admin Section)
*   **Gatekeeping:** Users cannot simply "register" for the Admin Panel (UTA).
*   **Flow:**
    1.   User requests access via email -> OTP verification.
    2.   Row created in `admin_access_requests` with `status: 'pending'`.
    3.   **Super Admin** receives an email with a "Magic Link".
    4.   Super Admin clicks link -> `status` updates to `'approved'`.
    5.   User can now log in to UTA.

---

## 6. Media Storage (`media_assets`)

**Migration File:** `migrations/007_create_media_assets.sql`

### Schema
```sql
CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    filename TEXT NOT NULL,
    mimetype TEXT NOT NULL,
    size INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Logic & Flow (`MediaController.js`)
*   **Upload:** Uses `multer` to handle `multipart/form-data`.
*   **Storage:** Files are currently saved to the local filesystem (`/uploads`).
*   **Access:** The `url` field contains the public-facing URL (e.g., `http://localhost:4000/uploads/xyz.jpg`) to serve the file back to the frontend.

