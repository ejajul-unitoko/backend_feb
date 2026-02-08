import express from 'express';
import marketsRoutes from './public/markets.routes.js';

const router = express.Router();

// Public routes - no authentication required
router.use('/markets', marketsRoutes);

export default router;

