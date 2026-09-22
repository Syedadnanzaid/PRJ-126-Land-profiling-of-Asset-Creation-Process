import { Router } from 'express';
import assetsRoutes from '../modules/assets/assets.routes';
import authRoutes from '../modules/auth/auth.routes';
import analyticsRoutes from '../modules/analytics/analytics.routes';
import duplicatesRoutes from '../modules/duplicates/duplicates.routes';
import { documentRoutes } from '../modules/documents/documents.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/assets', assetsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/duplicates', duplicatesRoutes);
router.use('/documents', documentRoutes);

export default router;