-- Migration: Add Market Permissions to RBAC
-- Purpose: Enable market management permissions for admin users

-- Insert market permissions for UTA scope
INSERT INTO permissions (slug, scope, description) VALUES
    ('markets:create', 'uta', 'Create new markets'),
    ('markets:read', 'uta', 'View all markets in admin panel'),
    ('markets:update', 'uta', 'Update market details and status')
ON CONFLICT (scope, slug) DO NOTHING;

-- Assign all market permissions to super_admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin' 
  AND r.scope = 'uta'
  AND p.scope = 'uta'
  AND p.slug LIKE 'markets:%'
ON CONFLICT DO NOTHING;
