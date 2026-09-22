import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../../middleware/auth';
import * as documentsController from './documents.controller';

const router = Router();

// Configure multer storage
const uploadsDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB
    }
});

const documentRoutes = Router();
documentRoutes.use(authenticate);
documentRoutes.get('/:documentId/download', documentsController.downloadDocumentController);
documentRoutes.delete('/:documentId', documentsController.deleteDocumentController);

const assetDocumentRoutes = Router({ mergeParams: true });
assetDocumentRoutes.use(authenticate);
assetDocumentRoutes.post('/', upload.single('file'), documentsController.uploadDocumentController);
assetDocumentRoutes.get('/', documentsController.getAssetDocumentsController);

export { documentRoutes, assetDocumentRoutes };
