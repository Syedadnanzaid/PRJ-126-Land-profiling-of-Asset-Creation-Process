import { Router } from 'express';
import * as assetsController from './assets.controller';
import { authenticate } from '../../middleware/auth';


const router = Router();

router.use(authenticate);

router.get('/', assetsController.getAllAssets);
router.get('/:assetId', assetsController.getAssetById);
router.post('/', assetsController.createAsset);
router.put('/:assetId', assetsController.updateAsset);
router.delete('/:assetId', assetsController.deleteAsset);



export default router;
