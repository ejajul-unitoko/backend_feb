# Backend Folder Structure Guide

## Overview

The backend follows a **scope-based architecture** where code is organized by user type (scope) to ensure clear separation of concerns, better security, and easier navigation.

## Scopes

The system supports 5 distinct scopes:

- **`admin`** - UTA (Unitoko Admin) - Platform administrators
- **`business`** - UTB (Unitoko Business) - Business owners/sellers
- **`customer`** - UTC (Unitoko Customer) - End customers
- **`delivery`** - UTD (Unitoko Delivery) - Delivery riders
- **`public`** - Shared resources or unauthenticated endpoints

---

## Directory Structure

```
src/
├── config/              # Database and app configuration
├── middleware/          # Authentication, RBAC, error handling
├── utils/               # Shared utilities (slugify, helpers, etc.)
│
├── controllers/         # Request handlers
│   ├── admin/          # Admin-only controllers
│   ├── business/       # Business-only controllers
│   ├── customer/       # Customer-only controllers
│   ├── delivery/       # Delivery-only controllers
│   └── public/         # Public/shared controllers
│
├── services/           # Business logic layer
│   ├── admin/         # Admin-specific business logic
│   ├── business/      # Business-specific business logic
│   ├── customer/      # Customer-specific business logic
│   ├── delivery/      # Delivery-specific business logic
│   └── public/        # Public/shared business logic
│
├── repositories/       # Data access layer
│   ├── admin/         # Admin-specific data access
│   ├── business/      # Business-specific data access
│   ├── customer/      # Customer-specific data access
│   ├── delivery/      # Delivery-specific data access
│   └── public/        # Shared data access (used by multiple scopes)
│
├── routes/            # API route definitions
│   ├── admin/        # Admin API routes
│   ├── business/     # Business API routes
│   ├── customer/     # Customer API routes
│   ├── delivery/     # Delivery API routes
│   └── public/       # Public API routes
│
└── validators/        # Input validation
    ├── admin/        # Admin input validators
    ├── business/     # Business input validators
    ├── customer/     # Customer input validators
    ├── delivery/     # Delivery input validators
    └── public/       # Public input validators
```

---

## Scope-Based Organization Rules

### 1. **Controllers**

Controllers handle HTTP requests and responses for specific scopes.

**Location Rules:**
- Admin-only operations → `controllers/admin/`
- Business-only operations → `controllers/business/`
- Customer-only operations → `controllers/customer/`
- Delivery-only operations → `controllers/delivery/`
- Public/unauthenticated operations → `controllers/public/`

**Example:**
```
controllers/
├── admin/
│   ├── AdminMarketController.js    # Admin market management
│   └── AdminUserController.js      # Admin user management
└── public/
    └── MarketController.js         # Public market browsing
```

---

### 2. **Services**

Services contain business logic and orchestrate repository calls.

**Location Rules:**
- If logic is **scope-specific** (e.g., admin CRUD, customer checkout), place in the appropriate scope folder
- If logic is **shared** across multiple scopes, place in `public/`

**Example:**
```
services/
├── admin/
│   └── MarketService.js           # Admin: create, update, delete markets
├── public/
│   └── MarketService.js           # Public: list, search markets
└── AuthService.js                 # Shared across all scopes (root level)
```

**Why Split Services?**
- **Security**: Admin operations (create, delete) are clearly separated from public operations (list, search)
- **Maintainability**: Easier to find and modify scope-specific logic
- **Testing**: Can test admin vs public functionality independently

---

### 3. **Repositories**

Repositories handle database queries and data access.

**Location Rules:**
- If a repository is **shared** by multiple scopes (e.g., `MarketRepository` used by both admin and public), place in `public/`
- If a repository is **scope-specific** (e.g., only admin needs it), place in that scope folder

**Example:**
```
repositories/
├── public/
│   ├── MarketRepository.js        # Shared by admin & public services
│   ├── UserRepository.js          # Shared across scopes
│   └── RbacRepository.js          # Shared RBAC data access
└── admin/
    └── AdminUserRepository.js     # Admin-specific user operations
```

**Why `public/` for Shared Repositories?**
- Repositories are data access layers that don't contain business logic
- Placing shared repositories in `public/` indicates they're common resources
- Both `services/admin/MarketService.js` and `services/public/MarketService.js` can import from `repositories/public/MarketRepository.js`

---

### 4. **Routes**

Routes define API endpoints and apply middleware (auth, RBAC, validation).

**Location Rules:**
- Admin routes → `routes/admin/`
- Business routes → `routes/business/`
- Customer routes → `routes/customer/`
- Delivery routes → `routes/delivery/`
- Public routes → `routes/public/`

**Naming Convention:**
- Use lowercase with underscores or hyphens
- Name after the resource: `markets.routes.js`, `users.routes.js`

**Example:**
```
routes/
├── admin/
│   ├── markets.routes.js          # Admin market management
│   └── users.routes.js            # Admin user management
├── public/
│   └── markets.routes.js          # Public market browsing
└── auth.routes.js                 # Shared auth routes (root level)
```

---

### 5. **Validators**

Validators check input data before it reaches services.

**Location Rules:**
- Place validators in the scope folder that uses them
- If validation logic is shared, place in `public/`

**Example:**
```
validators/
├── admin/
│   └── MarketValidators.js        # Validate admin market operations
├── public/
│   └── SearchValidators.js        # Validate public search queries
└── AuthValidators.js              # Shared auth validation (root level)
```

---

## Markets System Example

Here's how the markets system is organized:

### Admin Scope (UTA)
```
controllers/admin/AdminMarketController.js  # Admin market operations
services/admin/MarketService.js             # Admin business logic (CRUD)
routes/admin/markets.routes.js              # Admin API routes
validators/admin/MarketValidators.js        # Admin input validation
```

### Public Scope (UTC/UTB)
```
controllers/public/MarketController.js      # Public market browsing
services/public/MarketService.js            # Public business logic (list, search)
routes/public/markets.routes.js             # Public API routes
```

### Shared Resources
```
repositories/public/MarketRepository.js     # Shared data access
utils/slugify.js                            # Shared utility
```

---

## Import Path Examples

### Controller Importing Service
```javascript
// Admin controller
import MarketService from '../../services/admin/MarketService.js';

// Public controller
import MarketService from '../../services/public/MarketService.js';
```

### Service Importing Repository
```javascript
// Both admin and public services import the same repository
import MarketRepository from '../../repositories/public/MarketRepository.js';
```

### Route Importing Controller
```javascript
// Admin route
import AdminMarketController from '../../controllers/admin/AdminMarketController.js';

// Public route
import MarketController from '../../controllers/public/MarketController.js';
```

---

## Benefits of Scope-Based Structure

✅ **Clear Separation of Concerns**
- Admin logic is clearly separated from public logic
- Easy to identify what code belongs to which scope

✅ **Better Security**
- Scope-specific files make it harder to accidentally expose admin logic
- RBAC middleware is applied at the route level per scope

✅ **Easier Navigation**
- Developers can quickly find files by scope
- New team members can understand the structure intuitively

✅ **Scalability**
- Easy to add new scopes (business, customer, delivery) in the future
- Consistent structure across all layers

✅ **Maintainability**
- Changes to one scope don't affect others
- Easier to test scope-specific functionality

✅ **Code Reusability**
- Shared resources (repositories, utils) are clearly identified in `public/`
- No duplication of data access logic

---

## When to Use Each Scope

### `admin/`
- Operations that require admin authentication
- CRUD operations for platform resources
- User management, market management, reports
- **Example**: Creating markets, managing users, viewing analytics

### `business/`
- Operations for business owners/sellers
- Inventory management, order processing, shop settings
- **Example**: Adding products, managing orders, updating shop details

### `customer/`
- Operations for end customers
- Browsing products, placing orders, managing profile
- **Example**: Searching products, adding to cart, checkout

### `delivery/`
- Operations for delivery riders
- Order pickup, delivery tracking, earnings
- **Example**: Accepting deliveries, updating delivery status

### `public/`
- Unauthenticated endpoints
- Shared resources used by multiple scopes
- **Example**: Browsing markets without login, shared repositories

---

## Root-Level Files

Some files remain at the root of their respective directories when they're shared across **all** scopes:

```
src/
├── services/
│   ├── AuthService.js             # Used by all scopes
│   ├── OtpService.js              # Used by all scopes
│   └── admin/...
├── repositories/
│   ├── UserRepository.js          # Used by all scopes
│   ├── SessionRepository.js       # Used by all scopes
│   └── public/...
└── validators/
    ├── AuthValidators.js          # Used by all scopes
    └── admin/...
```

**Rule of Thumb:**
- If a file is used by **all scopes** → Root level
- If a file is used by **multiple but not all scopes** → `public/`
- If a file is used by **one scope only** → That scope's folder

---

## Migration Checklist

When adding a new feature, follow this structure:

1. **Identify the scope(s)** - Which user types will use this feature?
2. **Create repository** - Place in `public/` if shared, otherwise in scope folder
3. **Create service(s)** - Split by scope if logic differs (admin vs public)
4. **Create controller(s)** - One per scope
5. **Create routes** - One route file per scope
6. **Create validators** - Place in appropriate scope folder
7. **Update server.js** - Register new routes
8. **Test** - Verify all endpoints work correctly

---

## Common Patterns

### Pattern 1: Admin + Public Split
**Use Case**: Feature has both admin management and public browsing

```
controllers/admin/AdminResourceController.js    # Admin CRUD
controllers/public/ResourceController.js        # Public list/search
services/admin/ResourceService.js               # Admin logic
services/public/ResourceService.js              # Public logic
repositories/public/ResourceRepository.js       # Shared data access
```

### Pattern 2: Single Scope
**Use Case**: Feature is only for one scope

```
controllers/admin/AdminReportController.js
services/admin/ReportService.js
repositories/admin/ReportRepository.js
```

### Pattern 3: Fully Shared
**Use Case**: Feature is identical across all scopes

```
services/OtpService.js                          # Root level
repositories/public/SessionRepository.js        # Shared repository
```

---

## Questions?

**Q: Where do I put a repository used by both admin and business?**
A: Place it in `repositories/public/` - it's a shared resource.

**Q: Should I split a service if admin and public logic is very similar?**
A: Yes, even if similar. It provides clear separation and makes future changes easier.

**Q: Can a public controller use an admin service?**
A: No! Public controllers should only use public services. This maintains security boundaries.

**Q: Where do I put middleware?**
A: Middleware (auth, RBAC, error handling) stays in the root `middleware/` folder as it's shared across all scopes.

---

## Summary

The scope-based structure ensures:
- **Security**: Clear boundaries between admin and public code
- **Maintainability**: Easy to find and modify scope-specific logic
- **Scalability**: Simple to add new scopes as the platform grows
- **Clarity**: Developers can quickly understand the codebase structure

Follow this structure for all new features to maintain consistency across the codebase.
