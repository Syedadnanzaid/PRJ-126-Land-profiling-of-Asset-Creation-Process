import prisma from '../../config/database';
import { EventType, ApplicationStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export const uploadDocument = async (
    applicationId: string,
    userId: string,
    file: Express.Multer.File,
    documentType?: string
) => {
    const application = await prisma.landApplication.findUnique({
        where: { application_id: applicationId }
    });

    if (!application) {
        throw new Error('Application not found');
    }

    // Ownership check
    if (application.applicant_id !== userId) {
        throw new Error('Forbidden: You can only upload documents to your own application');
    }

    // Status check
    if (application.status !== ApplicationStatus.DRAFT && application.status !== ApplicationStatus.CORRECTION_REQUIRED) {
        throw new Error(`Forbidden: Cannot upload documents when application is in ${application.status} state`);
    }

    const storageKey = `uploads/${file.filename}`;

    try {
        const document = await prisma.$transaction(async (tx) => {
            const newDoc = await tx.document.create({
                data: {
                    application_id: applicationId,
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
                    application_id: applicationId,
                    asset_id: null,
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

export const getApplicationDocuments = async (applicationId: string, userId: string, role: string) => {
    const application = await prisma.landApplication.findUnique({
        where: { application_id: applicationId }
    });

    if (!application) {
        throw new Error('Application not found');
    }

    if (role === 'APPLICANT' && application.applicant_id !== userId) {
        throw new Error('Forbidden: You can only view documents of your own application');
    }

    return prisma.document.findMany({
        where: { application_id: applicationId },
        orderBy: { uploaded_at: 'desc' }
    });
};

export const getDocumentById = async (documentId: string) => {
    return prisma.document.findUnique({
        where: { document_id: documentId },
        include: { application: true }
    });
};

export const deleteDocument = async (documentId: string, userId: string) => {
    const document = await prisma.document.findUnique({
        where: { document_id: documentId },
        include: { application: true }
    });

    if (!document) {
        return null;
    }

    if (document.application.applicant_id !== userId) {
        throw new Error('Forbidden: You can only delete documents from your own application');
    }

    if (document.application.status !== ApplicationStatus.DRAFT && document.application.status !== ApplicationStatus.CORRECTION_REQUIRED) {
        throw new Error(`Forbidden: Cannot delete documents when application is in ${document.application.status} state`);
    }

    // Delete DB record
    await prisma.document.delete({
        where: { document_id: documentId }
    });

    return document;
};
