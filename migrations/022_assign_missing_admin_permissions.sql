-- Migration 022: Assign Missing Admin Permissions
-- Description: Ensures super_admin has all UTA permissions, specifically users:manage for riders/customers.

BEGIN;

-- Assign ALL 'uta' permissions to 'super_admin' role
-- This is a catch-all to ensure the master role actually has control
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id,
    p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin' 
  AND r.scope = 'uta'
  AND p.scope = 'uta'
ON CONFLICT DO NOTHING;

COMMIT;
