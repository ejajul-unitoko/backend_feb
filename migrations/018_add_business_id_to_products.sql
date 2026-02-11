-- Add business_id to products table to support Private Label / Business-Specific products
ALTER TABLE products
ADD COLUMN business_id UUID REFERENCES businesses(id);

-- Index for faster lookup of business-specific products
CREATE INDEX idx_products_business_id ON products(business_id);

-- Update RLS or constraints if necessary (logic handles this via service layer for now)
-- Global products have business_id = NULL
