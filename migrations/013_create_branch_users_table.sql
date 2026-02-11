-- Migration: Create branch_users table
-- Description: Manages user access to branches (branch managers, staff)
-- Dependencies: branches table, users table

-- Create branch_users table
CREATE TABLE IF NOT EXISTS branch_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Role within branch
    role TEXT NOT NULL
        CHECK (role IN ('owner', 'manager', 'staff')),
    
    -- Access status
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'revoked')),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Prevent duplicate assignments
    UNIQUE (branch_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_branch_users_branch_id ON branch_users(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_users_user_id ON branch_users(user_id);
CREATE INDEX IF NOT EXISTS idx_branch_users_role ON branch_users(role);
CREATE INDEX IF NOT EXISTS idx_branch_users_status ON branch_users(status);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_branch_users_branch_status ON branch_users(branch_id, status);

-- Comments for documentation
COMMENT ON TABLE branch_users IS 'Manages user access to branches (delegated access for managers/staff)';
COMMENT ON COLUMN branch_users.branch_id IS 'Reference to branch';
COMMENT ON COLUMN branch_users.user_id IS 'Reference to user (from universal users table)';
COMMENT ON COLUMN branch_users.role IS 'User role within branch: owner, manager, staff';
COMMENT ON COLUMN branch_users.status IS 'Access status: active, revoked';

-- Edge Case Handling:
-- 1. Edge Case 3: Users created with wrong email remain pending until first login
-- 2. Edge Case 5: Owner role bypasses branch restrictions (checked at service layer)
-- 3. CASCADE delete: If branch is deleted, all user assignments are removed
-- 4. CASCADE delete: If user is deleted, all branch assignments are removed
-- 5. UNIQUE constraint prevents duplicate user assignments to same branch
-- 6. Revoked status allows soft-delete of access without removing history
