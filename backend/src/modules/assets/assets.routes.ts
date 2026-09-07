import { Router } from 'express';
import * as assetsController from './assets.controller';

const router = Router();

router.get('/', assetsController.getAllAssets);
router.get('/:assetId', assetsController.getAssetById);
router.post('/', assetsController.createAsset);
router.put('/:assetId', assetsController.updateAsset);
router.delete('/:assetId', assetsController.deleteAsset);

export default router;
