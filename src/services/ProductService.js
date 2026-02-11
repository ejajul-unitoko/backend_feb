import ProductRepository from '../repositories/ProductRepository.js';
import BusinessProductRepository from '../repositories/BusinessProductRepository.js';
import BranchProductRepository from '../repositories/BranchProductRepository.js';
import CategoryRepository from '../repositories/CategoryRepository.js';
import BranchRepository from '../repositories/BranchRepository.js';
import InventoryService from './InventoryService.js';
import BusinessRepository from '../repositories/BusinessRepository.js';

class ProductService {
    // ===================================
    // GLOBAL PRODUCT (Admin / Owner)
    // ===================================

    /**
     * Create Product - Handles both Global (Admin) and Private (Business) flows
     * 3-Layer Architecture: Product -> BusinessProduct -> BranchProduct
     */
    async createProduct(data, userId) {
        // Validate category
        if (data.category_id) {
            const category = await CategoryRepository.findById(data.category_id);
            if (!category) throw new Error('Category not found');
        }

        const { branch_id, business_id, ...productData } = data;

        // 1. Determine Identity & Create Global Product Entry
        // Admin: business_id is NULL -> source_type='admin', platform_status='approved'
        // Business: business_id is SET -> source_type='business', platform_status='pending' (requires admin approval)
        // NOTE: In V1 Architecture, even Business Products are stored in `products` table as identity.

        const sourceType = business_id ? 'business' : 'admin';
        const platformStatus = business_id ? 'pending' : 'approved'; // Admin products auto-approved

        const product = await ProductRepository.create({
            ...productData,
            created_by: userId,
            source_type: sourceType,
            platform_status: platformStatus,
            origin_business_id: business_id || null
        });

        let businessProduct = null;
        let branchProduct = null;

        // 2. If Business Context (Private Label or Claiming), Create Ownership Entry
        if (business_id) {
            // Business creating their own product -> Auto-claim ownership
            businessProduct = await BusinessProductRepository.create({
                business_id: business_id,
                product_id: product.id,
                created_by_user_id: userId,
                approval_status: 'pending', // Waiting for Admin to approve this specific business product
                status: 'active'
            });

            // 3. Auto-link to Branch (Selling Layer)
            if (branch_id) {
                // Check if branch belongs to business
                const branch = await BranchRepository.findById(branch_id);
                if (branch && branch.business_id === business_id) {
                    const linkData = {
                        price: productData.price || 0,
                        stock_quantity: 0,
                        is_available: true
                    };
                    try {
                        // Use internal method that handles BusinessProduct -> BranchProduct linking
                        branchProduct = await this.addBusinessProductToBranch(branch_id, businessProduct.id, linkData);
                    } catch (err) {
                        console.warn(`Failed to auto-link product ${product.id} to branch ${branch_id}: ${err.message}`);
                        product._autoLinkError = err.message;
                    }
                }
            }
        }

        return { ...product, business_product: businessProduct, branch_product: branchProduct };
    }

    async createMyProduct(userId, data) {
        // 1. Resolve Business
        const business = await BusinessRepository.findByOwnerId(userId);
        if (!business) throw new Error('User does not own a business');

        // 2. Delegate to generic create with enforced business_id
        return await this.createProduct({
            ...data,
            business_id: business.id
        }, userId);
    }

    async updateProduct(id, data) {
        // Validate existence
        const product = await ProductRepository.findById(id);
        if (!product) throw new Error('Product not found');
        return await ProductRepository.update(id, data);
    }

    async deleteProduct(id) {
        // Validate existence
        const product = await ProductRepository.findById(id);
        if (!product) throw new Error('Product not found');
        return await ProductRepository.softDelete(id);
    }

    async getAllProducts(filters = {}) {
        if (filters.q) {
            return await ProductRepository.search(filters.q, filters);
        }
        return await ProductRepository.findAll(filters);
    }

    async getProductById(id) {
        return await ProductRepository.findById(id);
    }

    async getTrash(filters = {}) {
        return await ProductRepository.findAllDeleted(filters);
    }

    async restoreProduct(id) {
        const product = await ProductRepository.restore(id);
        if (!product) throw new Error('Product not found or not in trash');
        return product;
    }

    /**
     * For Business to "Claim" or "Sell" an existing Global Product
     */
    async claimGlobalProduct(businessId, productId, userId) {
        // Check if product exists and is Global/Approved
        const product = await ProductRepository.findById(productId);
        if (!product) throw new Error('Product not found');
        if (product.platform_status !== 'approved') throw new Error('Product not approved for listing');

        // Check if already claimed
        let businessProduct = await BusinessProductRepository.findByBusinessAndProduct(businessId, productId);

        if (!businessProduct) {
            // Create Ownership Entry
            // Global products claimed by business are AUTO-APPROVED
            businessProduct = await BusinessProductRepository.create({
                business_id: businessId,
                product_id: productId,
                created_by_user_id: userId,
                approval_status: 'approved', // Auto-approve global items
                status: 'active'
            });
        }

        return businessProduct;
    }

    // ===================================
    // BRANCH PRODUCT (Selling Layer)
    // ===================================

    /**
     * Add ANY product to a branch.
     * Orchestrates: Global Product -> Ensure BusinessProduct exists -> Create BranchProduct
     */
    async addProductToBranch(branchId, productId, data, userId) {
        const branch = await BranchRepository.findById(branchId);
        if (!branch) throw new Error('Branch not found');
        const businessId = branch.business_id;

        // 1. Ensure Business Owns/Claims the Product
        // This will create 'business_products' entry if missing
        const businessProduct = await this.claimGlobalProduct(businessId, productId, userId);

        // 2. Link BusinessProduct to Branch
        return await this.addBusinessProductToBranch(branchId, businessProduct.id, data);
    }

    /**
     * Internal: Link an existing BusinessProduct to a Branch
     */
    async addBusinessProductToBranch(branchId, businessProductId, data) {
        // Check if already exists in branch
        const existing = await BranchProductRepository.findByBranchAndProduct(branchId, businessProductId);
        if (existing) throw new Error('Product already added to this branch');

        // Create Branch Product
        const branchProduct = await BranchProductRepository.create({
            branch_id: branchId,
            business_product_id: businessProductId,
            ...data
        });

        return branchProduct;
    }

    async updateBranchProductPrice(id, price, mrp) {
        const bp = await BranchProductRepository.findById(id);
        if (!bp) throw new Error('Branch product not found');
        return await BranchProductRepository.update(id, { price, mrp });
    }

    async getBranchProducts(branchId, filters = {}) {
        return await BranchProductRepository.findByBranchId(branchId, filters);
    }

    // ===================================
    // INVENTORY DELEGATION
    // ===================================

    async updateStock(branchProductId, change, reason, userId) {
        // InventoryService needs to be updated to use branch_products table correctly (which it does via ID)
        // But we should verify it targets the right table logic. 
        // Assuming InventoryLogRepository links to branch_product_id, we are good.
        // We'll rename the method call to match previous interface
        return await InventoryService.updateStock(branchProductId, change, reason, userId);
    }

    async getInventoryLogs(branchProductId) {
        return await InventoryService.getInventoryLogs(branchProductId);
    }

    // ===================================
    // PUBLIC CATALOG
    // ===================================

    async getMarketProducts(marketId, filters = {}) {
        return await BranchProductRepository.findByMarketId(marketId, filters);
    }

    // ===================================
    // ADMIN APPROVAL WORKFLOW
    // ===================================

    async approveBusinessProduct(businessProductId, status, reason = null) {
        // status: 'approved' or 'rejected'
        if (!['approved', 'rejected'].includes(status)) throw new Error('Invalid status');

        // 1. Try to Update Business Product Status directly (assuming ID is business_product_id)
        let businessProduct = await BusinessProductRepository.updateApprovalStatus(businessProductId, status, reason);

        // 1.5 FAILS? Check if the ID provided was actually a Global Product ID (User DX Fix)
        if (!businessProduct) {
            const product = await ProductRepository.findById(businessProductId);
            // If it is a global product and has an origin business, find the link
            if (product && product.origin_business_id) {
                businessProduct = await BusinessProductRepository.findByBusinessAndProduct(product.origin_business_id, product.id);
                if (businessProduct) {
                    // Found the correct Business Product! Update it.
                    businessProduct = await BusinessProductRepository.updateApprovalStatus(businessProduct.id, status, reason);
                }
            }
        }

        // 2. Sync with Global Product Platform Status (for consistency)
        if (businessProduct) {
            await ProductRepository.update(businessProduct.product_id, {
                platform_status: status // 'approved' or 'rejected'
            });
        } else {
            // If still not found, throw error to inform user ID is wrong
            throw new Error('Business Product not found (ID mismatch)');
        }

        return businessProduct;
    }

    async getMasterProductDetails(productId) {
        // 1. Fetch Global Product
        const product = await ProductRepository.findById(productId);
        if (!product) throw new Error('Product not found');

        // 2. Fetch Origin Business (if any)
        let originBusiness = null;
        if (product.origin_business_id) {
            originBusiness = await BusinessRepository.findById(product.origin_business_id);
        }

        // 3. Fetch All Business Deployments (Who is selling this?)
        // Fetch all business_products for this global product
        const businessProducts = await BusinessProductRepository.findAllByProduct(productId);

        // 4. For each Business Product, fetch its Branch Deployments
        const deployments = await Promise.all(businessProducts.map(async (bp) => {
            const business = await BusinessRepository.findById(bp.business_id);
            const markets = await BusinessRepository.getMarketsByBusinessId(bp.business_id);
            const branchProducts = await BranchProductRepository.findByBusinessProductId(bp.id);

            // Hydrate branch details
            const branches = await Promise.all(branchProducts.map(async (brp) => {
                const branch = await BranchRepository.findById(brp.branch_id);
                return {
                    ...brp,
                    branch_name: branch?.name,
                    branch_address: branch?.address
                };
            }));

            return {
                business_product: bp,
                business: business,
                markets: markets,
                branches: branches
            };
        }));

        return {
            product,
            origin_business: originBusiness,
            deployments: deployments
        };
    }

    async getMyBusinessProducts(userId) {
        // 1. Find Business for User
        const business = await BusinessRepository.findByOwnerId(userId);
        if (!business) throw new Error('User does not own a business');

        // 2. Fetch Business Products
        return await BusinessProductRepository.findAllByBusiness(business.id);
    }
}

export default new ProductService();
