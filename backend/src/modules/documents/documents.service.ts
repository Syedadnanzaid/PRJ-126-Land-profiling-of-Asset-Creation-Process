import prisma from '../../config/database';
import { EventType } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export const uploadDocument = async (
    assetId: string,
    userId: string,
    file: Express.Multer.File,
    documentType?: string
) => {
    // Verify asset exists
    const asset = await prisma.landAsset.findUnique({
        where: { asset_id: assetId }
    });

    if (!asset) {
        throw new Error('Asset not found');
    }

    const storageKey = `uploads/${file.filename}`;

    try {
        // Run in transaction to ensure both document and event are created together
        const document = await prisma.$transaction(async (tx) => {
            const newDoc = await tx.document.create({
                data: {
                    asset_id: assetId,
                    file_name: file.originalname,
                    document_type: documentType || null,
                    storage_key: storageKey,
                    mime_type: file.mimetype,
                    file_size: file.size,
                    uploaded_by: userId
                }
            });

            await tx.assetEvent.create({
                data: {
                    asset_id: assetId,
                    event_type: EventType.DOCUMENT_UPLOADED,
                    performed_by: userId,
                    metadata: {
                        document_id: newDoc.document_id,
                        file_name: file.originalname
                    }
                }
            });

            return newDoc;
        });

        return document;
    } catch (error) {
        throw error;
    }
};

export const getAssetDocuments = async (assetId: string) => {
    const asset = await prisma.landAsset.findUnique({
        where: { asset_id: assetId }
    });

    if (!asset) {
        throw new Error('Asset not found');
    }

    return prisma.document.findMany({
        where: { asset_id: assetId },
        orderBy: { uploaded_at: 'desc' }
    });
};

export const getDocumentById = async (documentId: string) => {
    return prisma.document.findUnique({
        where: { document_id: documentId }
    });
};

export const deleteDocument = async (documentId: string) => {
    const document = await prisma.document.findUnique({
        where: { document_id: documentId }
    });

    if (!document) {
        return null; // Return null if not found
    }

    // Delete DB record
    await prisma.document.delete({
        where: { document_id: documentId }
    });

    return document;
};
