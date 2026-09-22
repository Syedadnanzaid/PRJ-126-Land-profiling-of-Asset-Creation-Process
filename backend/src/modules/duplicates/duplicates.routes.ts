import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { checkDuplicateController, reviewDuplicateController } from './duplicates.controller';

const router = Router();

router.use(authenticate);

router.post('/check', checkDuplicateController);
router.patch('/:flagId/review', reviewDuplicateController);

export default router;