import express from 'express';
import ProductController from '../../controllers/ProductController.js';
import CategoryController from '../../controllers/CategoryController.js';

const router = express.Router();

// Categories
router.get('/categories', CategoryController.getAllCategories);

// Market Products (Catalog)
router.get('/markets/:marketId/products', ProductController.getMarketProducts);

// Product Detail (Global info? Or context aware? For now global + maybe basic availability if needed)
// Logic doc says: Shows Name, Price, Branch availability, ETA.
// The public controller `getMarketProducts` returns branch_product details (price). 
// `getProductById` in `ProductController` is global. 
// Let's rely on `getMarketProducts` for listing.
// For specific detail, we might need a dedicated public method or reuse global `getProductById`.
// logic doc: GET /public/products/:id
router.get('/products', ProductController.getAllProducts); // For global catalog/search
router.get('/products/:id', ProductController.getProductById);

export default router;
