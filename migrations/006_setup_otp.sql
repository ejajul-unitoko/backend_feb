-- Migration 006: Setup OTP and Admin Workflow
-- Description: Adds tables for OTP verification and Admin Access Requests. Seeds UTD Rider role.

-- 1. OTPs Table (Secure & Scoped)
CREATE TABLE IF NOT EXISTS otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target TEXT NOT NULL,         -- Email (lowercase)
    target_type TEXT NOT NULL DEFAULT 'email', -- email, phone
    purpose TEXT NOT NULL,        -- register, login, reset, admin_request
    scope TEXT NOT NULL,          -- uta, utb, utc, utd
    code_hash TEXT NOT NULL,
    
    -- Security & audits
    attempt_count INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup: Find active OTP for this user/purpose/scope
CREATE INDEX IF NOT EXISTS idx_otps_lookup ON otps(target, purpose, scope, consumed_at);
-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON otps(expires_at);

-- 2. Admin Access Requests (Workflow for UTA)
CREATE TABLE IF NOT EXISTS admin_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Context
    scope TEXT NOT NULL DEFAULT 'uta',
    request_context JSONB, -- { ip, userAgent }
    
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id), -- Super Admin who approved
    
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Seed UTD (Rider) Role & Permissions (Missed in Step 4)
INSERT INTO roles (name, scope, description) VALUES
    ('rider', 'utd', 'Delivery partner')
ON CONFLICT (scope, name) DO NOTHING;

INSERT INTO permissions (slug, scope, description) VALUES
    ('tasks:read', 'utd', 'View delivery tasks'),
    ('tasks:update', 'utd', 'Update task status')
ON CONFLICT (scope, slug) DO NOTHING;

-- Link Rider Role <-> Permissions
WITH 
    r_rider AS (SELECT id FROM roles WHERE name = 'rider' AND scope = 'utd'),
    p_read AS (SELECT id FROM permissions WHERE slug = 'tasks:read' AND scope = 'utd'),
    p_update AS (SELECT id FROM permissions WHERE slug = 'tasks:update' AND scope = 'utd')
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM r_rider r, p_read p
UNION ALL
SELECT r.id, p.id FROM r_rider r, p_update p
ON CONFLICT DO NOTHING;
