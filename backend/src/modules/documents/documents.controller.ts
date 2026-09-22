import { Request, Response, NextFunction } from 'express';
import * as documentsService from './documents.service';
import fs from 'fs';
import path from 'path';

export const uploadDocumentController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { assetId } = req.params;
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
            const document = await documentsService.uploadDocument(assetId, userId, file, document_type);
            res.status(201).json({ status: 'success', data: document });
        } catch (error: any) {
            if (file && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            if (error.message === 'Asset not found') {
                res.status(404).json({ status: 'error', message: error.message });
                return;
            }
            throw error;
        }
    } catch (error) {
        next(error);
    }
};

export const getAssetDocumentsController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { assetId } = req.params;
        try {
            const documents = await documentsService.getAssetDocuments(assetId);
            res.status(200).json({ status: 'success', data: documents });
        } catch (error: any) {
            if (error.message === 'Asset not found') {
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
        const document = await documentsService.getDocumentById(documentId);

        if (!document) {
            res.status(404).json({ status: 'error', message: 'Document not found' });
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
        const document = await documentsService.getDocumentById(documentId);

        if (!document) {
            res.status(404).json({ status: 'error', message: 'Document not found' });
            return;
        }
        const filePath = path.join(__dirname, '../../../', document.storage_key);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await documentsService.deleteDocument(documentId);

        res.status(200).json({ status: 'success', message: 'Document deleted successfully' });
    } catch (error) {
        next(error);
    }
};
