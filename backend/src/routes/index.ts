import { Router } from 'express';
import assetsRoutes from '../modules/assets/assets.routes';

const router = Router();

router.use('/assets', assetsRoutes);

export default router;
