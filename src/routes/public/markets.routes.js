import express from 'express';
import MarketController from '../../controllers/MarketController.js';

const router = express.Router();

// Public market endpoints (no authentication required)
router.get('/', MarketController.getPublicMarkets.bind(MarketController));
router.get('/search', MarketController.searchMarkets.bind(MarketController));
router.get('/:slug', MarketController.getMarketBySlug.bind(MarketController));

export default router;
