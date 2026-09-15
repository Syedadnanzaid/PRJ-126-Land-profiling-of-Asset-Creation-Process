import { Router } from 'express';
import assetsRoutes from '../modules/assets/assets.routes';
import authRoutes from '../modules/auth/auth.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/assets', assetsRoutes);

export default router;
