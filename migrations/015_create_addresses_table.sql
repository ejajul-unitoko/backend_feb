-- Migration: Create Addresses Table and Refactor Businesses/Branches
-- Description: Centralize address management

BEGIN;

-- 1. Create Addresses Table
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('business_registered', 'branch_location', 'customer_delivery', 'rider_home', 'warehouse')),
    
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT,
    landmark TEXT,
    
    city TEXT NOT NULL DEFAULT 'Delhi',
    district TEXT,
    state TEXT NOT NULL DEFAULT 'Delhi',
    country TEXT NOT NULL DEFAULT 'India',
    pincode TEXT NOT NULL,
    
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    
    is_default BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Indexes for Addresses
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_city ON addresses(city);
CREATE INDEX IF NOT EXISTS idx_addresses_pincode ON addresses(pincode);

-- 2. Add Foreign Keys to Businesses (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'registered_address_id') THEN
        ALTER TABLE businesses ADD COLUMN registered_address_id UUID REFERENCES addresses(id);
    END IF;
END $$;

-- 3. Add Foreign Keys to Branches (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branches' AND column_name = 'address_id') THEN
        ALTER TABLE branches ADD COLUMN address_id UUID REFERENCES addresses(id);
    END IF;
END $$;

COMMIT;
