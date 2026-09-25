import { Router } from 'express';
import * as assetsController from './assets.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', authorize('VERIFICATION_OFFICER', 'APPROVING_AUTHORITY', 'ADMIN'), assetsController.getAllAssets);
router.get('/:assetId', authorize('VERIFICATION_OFFICER', 'APPROVING_AUTHORITY', 'ADMIN'), assetsController.getAssetById);

export default router;
