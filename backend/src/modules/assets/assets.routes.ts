import { Router } from 'express';
import * as assetsController from './assets.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', assetsController.getAllAssets);
router.get('/:assetId', assetsController.getAssetById);

export default router;
