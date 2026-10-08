import { Request, Response, NextFunction } from 'express';
import * as documentsService from './documents.service';
import fs from 'fs';
import path from 'path';
import { analyzeDocumentConsistencyAndRecordEvent } from './document-ai.service';
import { ApplicationStatus } from '@prisma/client';

export const uploadDocumentController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { applicationId } = req.params;
        const { document_type } = req.body;
        const userId = (req as any).user?.user_id;
        const file = req.file;

        if (!userId) {
            if (file) fs.unlinkSync(file.path);
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        if (!file) {
            res.status(400).json({ status: 'error', message: 'File is required' });
            return;
        }

        try {
            const document = await documentsService.uploadDocument(applicationId, userId, file, document_type);
            res.status(201).json({ status: 'success', data: document });
        } catch (error: any) {
            if (file && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            if (error.message.startsWith('Forbidden')) {
                res.status(403).json({ status: 'error', message: error.message });
                return;
            }
            if (error.message === 'Application not found') {
                res.status(404).json({ status: 'error', message: error.message });
                return;
            }
            throw error;
        }
    } catch (error) {
        next(error);
    }
};

export const getApplicationDocumentsController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { applicationId } = req.params;
        const user = (req as any).user;
        try {
            const documents = await documentsService.getApplicationDocuments(applicationId, user.user_id, user.role);
            res.status(200).json({ status: 'success', data: documents });
        } catch (error: any) {
            if (error.message.startsWith('Forbidden')) {
                res.status(403).json({ status: 'error', message: error.message });
                return;
            }
            if (error.message === 'Application not found') {
                res.status(404).json({ status: 'error', message: error.message });
                return;
            }
            throw error;
        }
    } catch (error) {
        next(error);
    }
};

export const downloadDocumentController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { documentId } = req.params;
        const user = (req as any).user;
        const document = await documentsService.getDocumentById(documentId);

        if (!document) {
            res.status(404).json({ status: 'error', message: 'Document not found' });
            return;
        }

        // Authorization check
        if (user.role === 'APPLICANT' && document.application.applicant_id !== user.user_id) {
            res.status(403).json({ status: 'error', message: 'Forbidden: You cannot view documents belonging to other applications' });
            return;
        }

        const filePath = path.join(__dirname, '../../../', document.storage_key);
        
        if (!fs.existsSync(filePath)) {
            res.status(404).json({ status: 'error', message: 'Physical file not found' });
            return;
        }

        res.download(filePath, document.file_name);
    } catch (error) {
        next(error);
    }
};

export const deleteDocumentController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { documentId } = req.params;
        const userId = (req as any).user?.user_id;

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        try {
            const document = await documentsService.deleteDocument(documentId, userId);

            if (!document) {
                res.status(404).json({ status: 'error', message: 'Document not found' });
                return;
            }

            const filePath = path.join(__dirname, '../../../', document.storage_key);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            res.status(200).json({ status: 'success', message: 'Document deleted successfully' });
        } catch (error: any) {
            if (error.message.startsWith('Forbidden')) {
                res.status(403).json({ status: 'error', message: error.message });
                return;
            }
            throw error;
        }
    } catch (error) {
        next(error);
    }
};

export const analyzeDocumentController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { documentId } = req.params;
        const userId = (req as any).user?.user_id;

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        const document = await documentsService.getDocumentById(documentId);
        if (!document) {
            res.status(404).json({ status: 'error', message: 'Document not found' });
            return;
        }

        // Enforce ownership: only the applicant can trigger analysis for their own application
        if (document.application.applicant_id !== userId) {
            res.status(403).json({ status: 'error', message: 'Forbidden: You can only analyze documents belonging to your own application' });
            return;
        }

        // Enforce status: only allowed during DRAFT or CORRECTION_REQUIRED
        if (document.application.status !== ApplicationStatus.DRAFT && document.application.status !== ApplicationStatus.CORRECTION_REQUIRED) {
            res.status(409).json({ status: 'error', message: `Analysis is not permitted when application is in ${document.application.status} state` });
            return;
        }

        const result = await analyzeDocumentConsistencyAndRecordEvent(documentId, userId);
        
        res.status(200).json({ 
            status: 'success', 
            data: {
                event_id: result.event_id,
                cached: result.cached,
                metadata: result.metadata
            } 
        });
    } catch (error: any) {
        if (error.message && (error.message.startsWith('AI /') || error.message.includes('unavailable'))) {
            res.status(502).json({ status: 'error', message: error.message });
            return;
        }
        next(error);
    }
};
