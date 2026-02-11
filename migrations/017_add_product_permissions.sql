-- Add Permissions for Categories and Products (Scope: uta)
INSERT INTO permissions (slug, scope, description) VALUES
('categories:read', 'uta', 'View categories'),
('categories:manage', 'uta', 'Create, update, delete categories'),
('products:read', 'uta', 'View global products'),
('products:manage', 'uta', 'Create, update, delete global products'),
('inventory:read', 'uta', 'View inventory logs'),
('inventory:manage', 'uta', 'Adjust stock manually')
ON CONFLICT (scope, slug) DO NOTHING;

-- Grant to Super Admin
DO $$
DECLARE
    super_admin_role_id UUID;
    perm_id UUID;
BEGIN
    SELECT id INTO super_admin_role_id FROM roles WHERE name = 'super_admin' LIMIT 1;

    IF super_admin_role_id IS NOT NULL THEN
        -- Categories
        SELECT id INTO perm_id FROM permissions WHERE slug = 'categories:read' AND scope = 'uta';
        IF perm_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (super_admin_role_id, perm_id) ON CONFLICT DO NOTHING;
        END IF;
        
        SELECT id INTO perm_id FROM permissions WHERE slug = 'categories:manage' AND scope = 'uta';
        IF perm_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (super_admin_role_id, perm_id) ON CONFLICT DO NOTHING;
        END IF;

        -- Products
        SELECT id INTO perm_id FROM permissions WHERE slug = 'products:read' AND scope = 'uta';
        IF perm_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (super_admin_role_id, perm_id) ON CONFLICT DO NOTHING;
        END IF;
        
        SELECT id INTO perm_id FROM permissions WHERE slug = 'products:manage' AND scope = 'uta';
        IF perm_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (super_admin_role_id, perm_id) ON CONFLICT DO NOTHING;
        END IF;

        -- Inventory
        SELECT id INTO perm_id FROM permissions WHERE slug = 'inventory:read' AND scope = 'uta';
        IF perm_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (super_admin_role_id, perm_id) ON CONFLICT DO NOTHING;
        END IF;
        
        SELECT id INTO perm_id FROM permissions WHERE slug = 'inventory:manage' AND scope = 'uta';
        IF perm_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (super_admin_role_id, perm_id) ON CONFLICT DO NOTHING;
        END IF;
    END IF;
END $$;
