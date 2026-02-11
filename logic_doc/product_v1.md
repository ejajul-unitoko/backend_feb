# UNITOKO – Comprehensive Product Management System (V1 Architecture Plan)

---

# 1. SYSTEM PHILOSOPHY

Product management in Unitoko must support:

*   Multi-business
*   Multi-branch
*   Market-aware listing
*   Admin moderation
*   Inventory tracking
*   Analytics visibility
*   Public browsing
*   Role-based control

The system must separate:

1.  **Product Identity** (What the product is)
2.  **Business Ownership** (Who created it)
3.  **Branch Listing** (Where it is sold)
4.  **Platform Approval** (Admin validation)
5.  **Public Visibility** (Customer-facing)

---

# 2. CORE ARCHITECTURE LAYERS

```mermaid
graph TD
    A[PRODUCT (Global Identity Layer)] --> B[BUSINESS_PRODUCT (Business Ownership Layer)]
    B --> C[BRANCH_PRODUCT (Selling & Inventory Layer)]
    C --> D[MARKET VISIBILITY (Derived via Branch → Market)]
```

---

# 3. DATABASE STRUCTURE

## 3.1 `products` (Global Identity Layer)

**Purpose:** Represents the universal product definition.

*   `id` (UUID) - Primary Key
*   `name` (TEXT)
*   `slug` (TEXT) - Unique
*   `description` (TEXT)
*   `category_id` (UUID) - FK to `categories`
*   `unit` (TEXT) - e.g., kg, litre, piece
*   `is_perishable` (BOOLEAN)
*   `created_by_user_id` (UUID) - FK to `users`
*   `source_type` (ENUM) - 'admin' | 'business'
*   `platform_status` (ENUM) - 'pending', 'approved', 'rejected'
*   `status` (ENUM) - 'active', 'inactive'
*   `created_at`, `updated_at`, `deleted_at`

**Rules:**

*   Admin-created products auto-approved (`platform_status` = 'approved').
*   Business-created products require admin approval (`platform_status` = 'pending').
*   Product never hard-deleted (Soft Delete only).

---

## 3.2 `product_media`

*   `id` (UUID)
*   `product_id` (UUID) - FK to `products`
*   `media_asset_id` (UUID) - FK to `media_assets`
*   `is_primary` (BOOLEAN)

---

## 3.3 `business_products` (Ownership Layer)

**Purpose:** Maps a product to a business. Enables "Private Label" ownership and approval status per business instance.

*   `id` (UUID) - Primary Key
*   `business_id` (UUID) - FK to `businesses`
*   `product_id` (UUID) - FK to `products`
*   `created_by_user_id` (UUID) - FK to `users`
*   `approval_status` (ENUM) - 'pending', 'approved', 'rejected'
*   `rejection_reason` (TEXT)
*   `status` (ENUM) - 'active', 'inactive' (Business Owner Toggle)
*   `created_at` (TIMESTAMPTZ)

**Rules:**

*   **A product must be approved at the `business_product` level** before it can be listed effectively.
*   This table links the Generic Product to a Specific Business context.

---

## 3.4 `branch_products` (Selling Layer)

**Purpose:** Selling layer. Links a `business_product` to a specific `branch`.

*   `id` (UUID) - Primary Key
*   `branch_id` (UUID) - FK to `branches`
*   `business_product_id` (UUID) - FK to `business_products` (**Changed from `products`**)
*   `price` (DECIMAL)
*   `mrp` (DECIMAL)
*   `stock_quantity` (INT)
*   `low_stock_threshold` (INT)
*   `is_available` (BOOLEAN)
*   `status` (ENUM) - 'active', 'inactive'
*   `created_at`, `updated_at`

**Rules:**

*   **Price lives here.**
*   **Inventory lives here.**
*   Unique constraint on `(branch_id, business_product_id)`.

---

## 3.5 `inventory_logs` (Audit)

*   `id` (UUID)
*   `branch_product_id` (UUID) - FK to `branch_products`
*   `change_amount` (INT)
*   `reason` (ENUM) - 'order', 'manual_adjustment', 'refund', 'admin_override'
*   `performed_by_user_id` (UUID) - FK to `users`
*   `created_at` (TIMESTAMPTZ)

**Mandatory for audit.**

---

# 4. BUSINESS FEATURES (UTB)

## 4.1 Create Product

**Flow:**

1.  Owner creates product via UI.
2.  System creates `product` entry with `source_type='business'`.
3.  System creates `business_product` entry with `approval_status='pending'`.
4.  Admin review is required for visibility.

**Edge Cases:**

*   Duplicate product names → Allow but ensure unique `slug`.
*   Spam/Fake products → Blocked at approval stage.

## 4.2 Update Product Details

**Editable:**

*   Description
*   Images
*   Category (before approval)

**Restrictions:**

*   If product is already approved and selling → Major changes (like name/category) might require re-approval or versioning.

## 4.3 Activate / Deactivate Product

**Hierarchy of Control:**

1.  **Platform Level (Admin):** `product.platform_status` / `business_product.approval_status`
2.  **Business Level (Owner):** `business_product.status`
3.  **Branch Level (Manager):** `branch_product.status`

**Visibility Rule:** Product is visible ONLY if ALL layers are Active/Approved.

## 4.4 Product Metrics (Business Dashboard)

Business can see:

*   Total sales quantity
*   Total revenue
*   Per branch performance
*   Low stock alerts
*   Conversion metrics

**Data Source:** Derived from `orders` linked to `branch_products`.

## 4.5 Share Product

**Generate:**

*   Public URL using slug: `https://unitoko.com/product/market-slug/product-slug`
*   Optional share token for deep linking.

---

# 5. ADMIN FEATURES (UTA)

## 5.1 Global Product Creation

*   Admin creates `product` with `source_type='admin'` and `platform_status='approved'`.
*   Businesses can search and "claim" these products (creating a `business_product` entry instantly approved).

## 5.2 Product Approval Flow

**States:** `pending` → `approved` OR `rejected`.

**Admin Actions:**

*   **Approve:** Sets `approval_status='approved'`. Product goes live.
*   **Reject:** Sets `approval_status='rejected'` with `rejection_reason`.

## 5.3 Advanced Admin Controls

*   Disable product globally.
*   Adjust inventory (override).
*   View inventory logs.
*   Filter products by Business, Branch, Market, or Category.

---

# 6. PUBLIC ACCESS (UTC / UTD / External)

## 6.1 Public Product Routes

Accessible without login:

*   `GET /public/products`
*   `GET /public/products/:slug`
*   `GET /public/markets/:id/products`

**Visibility Conditions (Strict):**

1.  `business_product.approval_status` = 'approved'
2.  `business_product.status` = 'active'
3.  `branch_product.status` = 'active'
4.  `branch.status` = 'active'
5.  `stock_quantity` > 0 (Optional filter)

## 6.2 Delivery App View (UTD)

Delivery can see:

*   Product Name, Quantity, Pickup Branch.

Cannot see:

*   Business Analytics, Cost Price, etc.

---

# 7. EDGE CASES & SOLUTIONS

1.  **Race Condition on Inventory:**
    *   **Solution:** Use row-level locking (`FOR UPDATE`) inside transactions when updating stock.
2.  **Product Deleted with Past Orders:**
    *   **Solution:** Soft delete only (`deleted_at`). Never remove rows.
3.  **Business Tries to Bypass Approval:**
    *   **Solution:** Enforce `approval_status` check at API middleware level for Public Routes.
4.  **Admin Disables Business:**
    *   **Solution:** Cascade visibility block to all associated `business_products` and `branch_products`.

---

# 8. SUMMARY

This product architecture ensures:

*   Controlled listing
*   Multi-branch selling
*   Clean audit trail
*   Admin moderation
*   Public discoverability
*   Secure inventory management

This completes the **Product Management Foundation for Unitoko V1**.
