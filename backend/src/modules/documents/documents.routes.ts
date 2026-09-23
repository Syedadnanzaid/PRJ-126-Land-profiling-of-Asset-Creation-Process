import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../middleware/auth';
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
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
        }
    }
});

const documentRoutes = Router();
documentRoutes.use(authenticate);

// Download logic is handled by controller based on user role (APPLICANT vs others)
documentRoutes.get('/:documentId/download', documentsController.downloadDocumentController);

// Delete logic enforces APPLICANT role inside controller (must own app + status checks)
documentRoutes.delete(
    '/:documentId',
    authorize(Role.APPLICANT),
    documentsController.deleteDocumentController
);

const applicationDocumentRoutes = Router({ mergeParams: true });
applicationDocumentRoutes.use(authenticate);

// Only APPLICANTS can upload, controller checks ownership and status
applicationDocumentRoutes.post(
    '/',
    authorize(Role.APPLICANT),
    upload.single('file'),
    documentsController.uploadDocumentController
);

// All roles can view documents, but APPLICANTS only view their own
applicationDocumentRoutes.get(
    '/',
    documentsController.getApplicationDocumentsController
);

export { documentRoutes, applicationDocumentRoutes };
