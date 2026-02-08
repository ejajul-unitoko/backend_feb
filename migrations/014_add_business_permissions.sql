-- Migration: Add business-related RBAC permissions
-- Description: Adds permissions for business management (admin scope)
-- Dependencies: permissions table, roles table, role_permissions table

-- Add business permissions
INSERT INTO permissions (slug, description, scope, created_at)
VALUES
    ('businesses:create', 'Create new businesses (admin only)', 'uta', now()),
    ('businesses:read', 'View all businesses', 'uta', now()),
    ('businesses:update', 'Update business details', 'uta', now()),
    ('businesses:verify', 'Verify business KYC (approve/reject)', 'uta', now())
ON CONFLICT (slug, scope) DO NOTHING;

-- Assign all business permissions to super_admin role for UTA scope
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT 
    r.id,
    p.id,
    now()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
  AND r.scope = 'uta'
  AND p.scope = 'uta'
  AND p.slug LIKE 'businesses:%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE permissions IS 'Updated with business management permissions for UTA scope';

-- Permission Breakdown:
-- 1. businesses:create - Admin can manually create businesses (rare, usually UTB self-registers)
-- 2. businesses:read - Admin can view all businesses for verification
-- 3. businesses:update - Admin can update business details if needed
-- 4. businesses:verify - Admin can approve/reject KYC (most important permission)

-- Note: UTB users don't need RBAC permissions for their own business
-- Ownership is checked at the service layer (owner_user_id)
