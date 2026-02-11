-- Categories Table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    parent_id UUID REFERENCES categories(id),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Products Table (Global Identity)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id),

    -- Product nature
    unit TEXT NOT NULL, -- kg, litre, piece
    is_perishable BOOLEAN DEFAULT false,

    -- Media
    cover_media_id UUID REFERENCES media_assets(id),

    -- Control
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),

    created_by UUID REFERENCES users(id),

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Branch Products Table (Selling Layer)
CREATE TABLE branch_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),

    -- Pricing
    price NUMERIC(10,2) NOT NULL,
    mrp NUMERIC(10,2),

    -- Inventory
    stock_quantity INT NOT NULL DEFAULT 0,
    low_stock_threshold INT DEFAULT 5,

    -- Availability
    is_available BOOLEAN DEFAULT true,

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE (branch_id, product_id)
);

-- Inventory Logs Table (Audit Trail)
CREATE TABLE inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    branch_product_id UUID REFERENCES branch_products(id),
    change INT NOT NULL, -- +5, -2
    reason TEXT NOT NULL, -- order, manual_adjustment, refund

    performed_by UUID REFERENCES users(id),

    created_at TIMESTAMPTZ DEFAULT now()
);
