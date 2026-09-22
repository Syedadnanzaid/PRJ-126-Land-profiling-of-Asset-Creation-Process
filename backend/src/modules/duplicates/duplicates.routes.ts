import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { checkDuplicateController } from './duplicates.controller';

const router = Router();

router.use(authenticate);

router.post('/check', checkDuplicateController);

export default router;