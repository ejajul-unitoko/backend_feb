import ProductService from '../services/ProductService.js';

class ProductController {
    // ===================================
    // GLOBAL PRODUCT (Admin / Owner)
    // ===================================

    async createProduct(req, res, next) {
        try {
            // User ID from auth middleware
            const userId = req.user.id;
            // Extract business_id and branch_id from body (if provided by Admin)
            const { business_id, branch_id, ...otherData } = req.body;

            const productData = {
                ...otherData,
                business_id: business_id || null, // Ensure explicit null for Global
                branch_id
            };

            const product = await ProductService.createProduct(productData, userId);
            res.status(201).json({
                success: true,
                message: 'Product created successfully',
                data: product
            });
        } catch (err) {
            next(err);
        }
    }

    async updateProduct(req, res, next) {
        try {
            const { id } = req.params;
            const product = await ProductService.updateProduct(id, req.body);
            res.json({
                success: true,
                message: 'Product updated successfully',
                data: product
            });
        } catch (err) {
            if (err.message === 'Product not found') {
                return res.status(404).json({ success: false, error: err.message });
            }
            next(err);
        }
    }

    async deleteProduct(req, res, next) {
        try {
            const { id } = req.params;
            await ProductService.deleteProduct(id);
            res.json({
                success: true,
                message: 'Product deleted (soft) successfully'
            });
        } catch (err) {
            if (err.message === 'Product not found') {
                return res.status(404).json({ success: false, error: err.message });
            }
            next(err);
        }
    }

    async getTrash(req, res, next) {
        try {
            const products = await ProductService.getTrash(req.query);
            res.json({
                success: true,
                count: products.length,
                data: products
            });
        } catch (err) {
            next(err);
        }
    }

    async restoreProduct(req, res, next) {
        try {
            const { id } = req.params;
            const product = await ProductService.restoreProduct(id);
            res.json({
                success: true,
                message: 'Product restored successfully',
                data: product
            });
        } catch (err) {
            if (err.message === 'Product not found or not in trash') {
                return res.status(404).json({ success: false, error: err.message });
            }
            next(err);
        }
    }

    async getAllProducts(req, res, next) {
        try {
            const products = await ProductService.getAllProducts(req.query);
            res.json({
                success: true,
                count: products.length,
                data: products
            });
        } catch (err) {
            next(err);
        }
    }

    async getProductById(req, res, next) {
        try {
            const { id } = req.params;
            const product = await ProductService.getProductById(id);
            res.json({
                success: true,
                data: product
            });
        } catch (err) {
            if (err.message === 'Product not found') {
                return res.status(404).json({ success: false, error: err.message });
            }
            next(err);
        }
    }

    async getMyBusinessProducts(req, res, next) {
        try {
            const userId = req.user.id;
            const products = await ProductService.getMyBusinessProducts(userId);
            res.json({
                success: true,
                count: products.length,
                data: products
            });
        } catch (err) {
            if (err.message === 'User does not own a business') {
                return res.status(404).json({ success: false, error: err.message });
            }
            next(err);
        }
    }

    async createMyProduct(req, res, next) {
        try {
            const userId = req.user.id;
            const product = await ProductService.createMyProduct(userId, req.body);
            res.status(201).json({
                success: true,
                message: 'Business product created successfully',
                data: product
            });
        } catch (err) {
            if (err.message === 'User does not own a business') {
                return res.status(403).json({ success: false, error: err.message });
            }
            if (err.message === 'Category not found') {
                return res.status(400).json({ success: false, error: err.message });
            }
            next(err);
        }
    }

    // ===================================
    // ADMIN APPROVAL WORKFLOW (New)
    // ===================================

    async approveBusinessProduct(req, res, next) {
        try {
            const { id } = req.params; // business_product_id
            const { status, reason } = req.body; // status: 'approved' | 'rejected'

            if (!status || !['approved', 'rejected'].includes(status)) {
                return res.status(400).json({ success: false, error: 'Valid status (approved/rejected) is required' });
            }

            const result = await ProductService.approveBusinessProduct(id, status, reason);
            res.json({
                success: true,
                message: `Product ${status} successfully`,
                data: result
            });
        } catch (err) {
            if (err.message.includes('not found') || err.message.includes('ID mismatch')) {
                return res.status(404).json({ success: false, error: err.message });
            }
            next(err);
        }
    }

    async getMasterProductDetails(req, res, next) {
        try {
            const { id } = req.params;
            const result = await ProductService.getMasterProductDetails(id);
            res.json({
                success: true,
                data: result
            });
        } catch (err) {
            if (err.message.includes('not found')) {
                return res.status(404).json({ success: false, error: err.message });
            }
            next(err);
        }
    }

    // ===================================
    // BRANCH PRODUCT (Business)
    // ===================================

    async addProductToBranch(req, res, next) {
        try {
            const { branchId } = req.params;
            const userId = req.user.id;
            // Body expects product_id, price, stock_quantity, etc.
            const { product_id, ...branchData } = req.body;

            if (!product_id) {
                return res.status(400).json({ success: false, error: 'product_id is required' });
            }

            const branchProduct = await ProductService.addProductToBranch(branchId, product_id, branchData, userId);
            res.status(201).json({
                success: true,
                message: 'Product added to branch successfully',
                data: branchProduct
            });
        } catch (err) {
            if (err.message.includes('not found')) {
                return res.status(404).json({ success: false, error: err.message });
            }
            if (err.message.includes('already added')) {
                return res.status(400).json({ success: false, error: err.message });
            }
            next(err);
        }
    }

    async updateBranchProductPrice(req, res, next) {
        try {
            const { id } = req.params; // branch_product_id
            const { price, mrp } = req.body;

            if (price === undefined) {
                return res.status(400).json({ success: false, error: 'Price is required' });
            }

            const updated = await ProductService.updateBranchProductPrice(id, price, mrp);
            res.json({
                success: true,
                message: 'Price updated successfully',
                data: updated
            });
        } catch (err) {
            if (err.message === 'Branch product not found') {
                return res.status(404).json({ success: false, error: err.message });
            }
            next(err);
        }
    }

    async updateStock(req, res, next) {
        try {
            const { id } = req.params; // branch_product_id
            const { change, reason } = req.body;
            const userId = req.user.id;

            if (change === undefined || !reason) {
                return res.status(400).json({ success: false, error: 'Change amount and reason are required' });
            }

            const updated = await ProductService.updateStock(id, parseInt(change), reason, userId);
            res.json({
                success: true,
                message: 'Stock updated successfully',
                data: updated
            });
        } catch (err) {
            if (err.message === 'Branch product not found') {
                return res.status(404).json({ success: false, error: err.message });
            }
            if (err.message.includes('Insufficient stock')) {
                return res.status(400).json({ success: false, error: err.message });
            }
            next(err);
        }
    }

    async getBranchProducts(req, res, next) {
        try {
            const { branchId } = req.params;
            const products = await ProductService.getBranchProducts(branchId, req.query);
            res.json({
                success: true,
                count: products.length,
                data: products
            });
        } catch (err) {
            next(err);
        }
    }

    async getInventoryLogs(req, res, next) {
        try {
            const { id } = req.params; // branch_product_id
            const logs = await ProductService.getInventoryLogs(id);
            res.json({
                success: true,
                count: logs.length,
                data: logs
            });
        } catch (err) {
            next(err);
        }
    }

    // ===================================
    // PUBLIC CATALOG
    // ===================================

    async getMarketProducts(req, res, next) {
        try {
            const { marketId } = req.params;
            const products = await ProductService.getMarketProducts(marketId, req.query);
            res.json({
                success: true,
                count: products.length,
                data: products
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new ProductController();
