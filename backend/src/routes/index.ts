import { Router } from 'express';
import assetsRoutes from '../modules/assets/assets.routes';
import authRoutes from '../modules/auth/auth.routes';
import analyticsRoutes from '../modules/analytics/analytics.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/assets', assetsRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
