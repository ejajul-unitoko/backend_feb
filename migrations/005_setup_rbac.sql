-- Migration 005: Setup RBAC
-- Description: Creates roles, permissions, and linking tables. Seeds initial data.

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,          -- e.g., business_owner, super_admin
    scope TEXT NOT NULL,         -- e.g., uta, utb, utc
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(scope, name)
);

-- 2. Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL,          -- e.g., reports:view, orders:create
    scope TEXT NOT NULL,         -- e.g., uta, utb
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(scope, slug)
);

-- 3. Role <-> Permission Mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (role_id, permission_id)
);

-- 4. User <-> Role Mapping
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id), -- Who assigned this role? (optional)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, role_id)
);

-- Indexes
CREATE INDEX idx_roles_scope ON roles(scope);
CREATE INDEX idx_permissions_scope ON permissions(scope);

-- SEED DATA ---------------------------------------------------------

-- 1. Insert Permissions
INSERT INTO permissions (slug, scope, description) VALUES 
    -- UTA
    ('reports:view', 'uta', 'View system reports'),
    ('users:manage', 'uta', 'Manage users'),
    ('leads:read', 'uta', 'View sales leads'),
    -- UTB
    ('staff:manage', 'utb', 'Manage branch staff'),
    ('inventory:manage', 'utb', 'Manage product inventory'),
    ('orders:manage', 'utb', 'Accept and fulfil orders'),
    -- UTC
    ('orders:create', 'utc', 'Place new orders'),
    ('profile:edit', 'utc', 'Edit own profile')
ON CONFLICT (scope, slug) DO NOTHING;

-- 2. Insert Roles
INSERT INTO roles (name, scope, description) VALUES
    ('super_admin', 'uta', 'Full system access'),
    ('sales', 'uta', 'Sales access'),
    ('investor', 'uta', 'View-only reporting access'),
    ('business_owner', 'utb', 'Full business access'),
    ('branch_manager', 'utb', 'Manage specific branch'),
    ('customer', 'utc', 'Standard end user')
ON CONFLICT (scope, name) DO NOTHING;

-- 3. Map Permissions to Roles (Helper CTEs)
WITH 
    r_sales AS (SELECT id FROM roles WHERE name = 'sales' AND scope = 'uta'),
    p_leads AS (SELECT id FROM permissions WHERE slug = 'leads:read' AND scope = 'uta'),
    
    r_investor AS (SELECT id FROM roles WHERE name = 'investor' AND scope = 'uta'),
    p_reports AS (SELECT id FROM permissions WHERE slug = 'reports:view' AND scope = 'uta'),

    r_owner AS (SELECT id FROM roles WHERE name = 'business_owner' AND scope = 'utb'),
    p_staff AS (SELECT id FROM permissions WHERE slug = 'staff:manage' AND scope = 'utb'),
    p_inv AS (SELECT id FROM permissions WHERE slug = 'inventory:manage' AND scope = 'utb'),
    p_orders_u AS (SELECT id FROM permissions WHERE slug = 'orders:manage' AND scope = 'utb'),

    r_cust AS (SELECT id FROM roles WHERE name = 'customer' AND scope = 'utc'),
    p_create AS (SELECT id FROM permissions WHERE slug = 'orders:create' AND scope = 'utc'),
    p_prof AS (SELECT id FROM permissions WHERE slug = 'profile:edit' AND scope = 'utc')

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM r_sales r, p_leads p
UNION ALL
SELECT r.id, p.id FROM r_investor r, p_reports p
UNION ALL
-- Business Owner gets all UTB perms seeded above
SELECT r.id, p.id FROM r_owner r, p_staff p
UNION ALL
SELECT r.id, p.id FROM r_owner r, p_inv p
UNION ALL
SELECT r.id, p.id FROM r_owner r, p_orders_u p
UNION ALL
-- Customer
SELECT r.id, p.id FROM r_cust r, p_create p
UNION ALL
SELECT r.id, p.id FROM r_cust r, p_prof p
ON CONFLICT DO NOTHING;
