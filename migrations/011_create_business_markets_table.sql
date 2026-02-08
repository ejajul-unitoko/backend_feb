-- Migration: Create business_markets junction table
-- Description: Many-to-many relationship between businesses and markets
-- Dependencies: businesses table, markets table

-- Create business_markets junction table
CREATE TABLE IF NOT EXISTS business_markets (
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    
    -- Composite primary key
    PRIMARY KEY (business_id, market_id),
    
    -- Timestamp for tracking when business was linked to market
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient lookups
CREATE INDEX idx_business_markets_business_id ON business_markets(business_id);
CREATE INDEX idx_business_markets_market_id ON business_markets(market_id);

-- Comments for documentation
COMMENT ON TABLE business_markets IS 'Junction table linking businesses to markets (many-to-many)';
COMMENT ON COLUMN business_markets.business_id IS 'Reference to business';
COMMENT ON COLUMN business_markets.market_id IS 'Reference to market';

-- Edge Case Handling:
-- 1. Edge Case 6: Business can operate in multiple markets (Karol Bagh + Lajpat Nagar)
-- 2. CASCADE delete: If business is deleted, all market links are removed
-- 3. CASCADE delete: If market is deleted, all business links are removed
-- 4. Composite PK prevents duplicate links
