-- 1. Update products table for V1 Architecture
-- Add source_type to distinguish origin
ALTER TABLE products 
ADD COLUMN source_type TEXT CHECK (source_type IN ('admin', 'business')) DEFAULT 'admin';

-- Add platform_status for approval workflow
ALTER TABLE products 
ADD COLUMN platform_status TEXT CHECK (platform_status IN ('pending', 'approved', 'rejected')) DEFAULT 'approved';

-- Function to migrate existing data logic
DO $$
BEGIN
    -- Existing products with business_id are 'business' source
    UPDATE products SET source_type = 'business' WHERE business_id IS NOT NULL;
    
    -- Rename business_id to origin_business_id for audit/lineage (optional but good practice)
    -- We keep business_id for now as legacy support or origin reference
    ALTER TABLE products RENAME COLUMN business_id TO origin_business_id;
END $$;

-- 2. Create business_products table (Ownership Layer)
CREATE TABLE business_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    created_by_user_id UUID REFERENCES users(id),
    
    approval_status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    
    status TEXT NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive')),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(business_id, product_id)
);

-- Index for performance
CREATE INDEX idx_business_products_business ON business_products(business_id);
CREATE INDEX idx_business_products_product ON business_products(product_id);

-- 3. Data Migration: Populate business_products
DO $$
BEGIN
    -- A. Migrate explicit business-owned products
    -- Create entry for the owning business
    INSERT INTO business_products (business_id, product_id, created_by_user_id, approval_status, status)
    SELECT origin_business_id, id, created_by, 'approved', status
    FROM products
    WHERE origin_business_id IS NOT NULL;

    -- B. Migrate implicit usage of global products in branches
    -- If a branch sells a product, the business must have a business_product entry
    INSERT INTO business_products (business_id, product_id, approval_status, status)
    SELECT DISTINCT b.business_id, bp.product_id, 'approved', 'active'
    FROM branch_products bp
    JOIN branches b ON bp.branch_id = b.id
    JOIN products p ON bp.product_id = p.id
    WHERE 
        -- Only if not already migrated in step A (via origin)
        -- AND ensure unique constraint handles duplicates (ON CONFLICT DO NOTHING)
        NOT EXISTS (
            SELECT 1 FROM business_products existing 
            WHERE existing.business_id = b.business_id 
            AND existing.product_id = bp.product_id
        );
END $$;

-- 4. Update branch_products (Selling Layer)
-- Add new FK
ALTER TABLE branch_products ADD COLUMN business_product_id UUID REFERENCES business_products(id);

-- Populate new FK
DO $$
BEGIN
    UPDATE branch_products bp
    SET business_product_id = (
        SELECT bp_link.id 
        FROM business_products bp_link
        JOIN branches b ON b.id = bp.branch_id
        WHERE bp_link.product_id = bp.product_id
        AND bp_link.business_id = b.business_id
        LIMIT 1
    );
END $$;

-- Enforce strictness after update (ensure data integrity)
-- If update failed for any row (orphan data), delete those rows
DELETE FROM branch_products WHERE business_product_id IS NULL;
ALTER TABLE branch_products ALTER COLUMN business_product_id SET NOT NULL;

-- Remove old link to products directly
ALTER TABLE branch_products DROP COLUMN product_id;

-- Add new constraint
ALTER TABLE branch_products ADD CONSTRAINT branch_products_unique_selling UNIQUE (branch_id, business_product_id);
