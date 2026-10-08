import { EventType } from '@prisma/client';
import prisma from '../../config/database';
import fs from 'fs/promises';
import path from 'path';

const AI_API_URL = process.env.AI_API_URL || 'http://127.0.0.1:8000';

export interface ConsistencyResult {
    extraction: {
        success: boolean;
        extraction_method: string;
        page_count: number;
        text: string;
    };
    consistency: {
        overall_consistency: string;
        fields: any;
        summary: any;
    };
}

export const analyzeDocumentConsistency = async (
    documentId: string
): Promise<ConsistencyResult> => {
    // 1. Fetch document and application
    const document = await prisma.document.findUnique({
        where: { document_id: documentId },
        include: { application: true }
    });

    if (!document) {
        throw new Error('Document not found');
    }

    const application = document.application;

    // Resolve file path safely
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    const filePath = path.resolve(process.cwd(), document.storage_key);
    const relativePath = path.relative(uploadsDir, filePath);
    
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        throw new Error('Invalid storage key: path traversal detected');
    }
    
    let fileBuffer: Buffer;
    try {
        fileBuffer = await fs.readFile(filePath);
    } catch (error) {
        throw new Error(`Failed to read document file from storage: ${document.storage_key}`);
    }

    // 2. Call Python /extract
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: document.mime_type || 'application/octet-stream' });
    const formData = new FormData();
    formData.append('file', blob, document.file_name || 'document.pdf');

    const extractController = new AbortController();
    const extractTimeout = setTimeout(() => extractController.abort(), 30000); // 30s timeout for OCR

    let extractResponse;
    try {
        extractResponse = await fetch(`${AI_API_URL}/extract`, {
            method: 'POST',
            body: formData,
            signal: extractController.signal
        });
    } catch (error) {
        throw new Error(`AI /extract service unavailable or timed out: ${(error as Error).message}`);
    } finally {
        clearTimeout(extractTimeout);
    }

    if (!extractResponse.ok) {
        throw new Error(`AI /extract service returned HTTP ${extractResponse.status}`);
    }

    const extractResult = await extractResponse.json();

    if (!extractResult.success || !extractResult.text) {
        throw new Error('AI /extract returned invalid or missing text');
    }

    // 3. Call Python /consistency
    const consistencyPayload = {
        application: {
            survey_no: application.survey_no,
            owner_name: application.owner_name,
            area: application.area,
            land_id: application.land_id
        },
        document_text: extractResult.text
    };

    const consistencyController = new AbortController();
    const consistencyTimeout = setTimeout(() => consistencyController.abort(), 10000); // 10s timeout

    let consistencyResponse;
    try {
        consistencyResponse = await fetch(`${AI_API_URL}/consistency`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(consistencyPayload),
            signal: consistencyController.signal
        });
    } catch (error) {
        throw new Error(`AI /consistency service unavailable or timed out: ${(error as Error).message}`);
    } finally {
        clearTimeout(consistencyTimeout);
    }

    if (!consistencyResponse.ok) {
        throw new Error(`AI /consistency service returned HTTP ${consistencyResponse.status}`);
    }

    const consistencyResult = await consistencyResponse.json();

    if (!consistencyResult.overall_consistency || !consistencyResult.fields) {
        throw new Error('AI /consistency returned invalid structured data');
    }

    // 4. Return structured result
    return {
        extraction: {
            success: extractResult.success,
            extraction_method: extractResult.extraction_method,
            page_count: extractResult.page_count,
            text: extractResult.text
        },
        consistency: consistencyResult
    };
};

export const analyzeDocumentConsistencyAndRecordEvent = async (
    documentId: string,
    performedBy: string
) => {
    if (!performedBy || performedBy.trim() === '') {
        throw new Error('performed_by user ID is required to record AI analysis events');
    }

    const document = await prisma.document.findUnique({
        where: { document_id: documentId }
    });

    if (!document) {
        throw new Error('Document not found');
    }

    // Duplicate event prevention strategy:
    // Fetch existing AI_DOCUMENT_ANALYZED events for this application.
    // If we find one with matching document_id in its metadata, we return it to avoid uncontrolled spam.
    const existingEvents = await prisma.assetEvent.findMany({
        where: {
            application_id: document.application_id,
            event_type: EventType.AI_DOCUMENT_ANALYZED
        }
    });
    const existingEvent = existingEvents.find(e => (e.metadata as any)?.document_id === documentId);
    
    if (existingEvent) {
        return {
            event_id: existingEvent.event_id,
            cached: true,
            metadata: existingEvent.metadata
        };
    }

    // Execute core analysis (throws on any OCR/consistency/timeout failure, satisfying the "Only create after success" rule)
    const result = await analyzeDocumentConsistency(documentId);

    // Build sanitized evidence metadata (EXCLUDING raw OCR text)
    const metadata = {
        document_id: document.document_id,
        file_name: document.file_name,
        extraction_method: result.extraction.extraction_method,
        page_count: result.extraction.page_count,
        overall_consistency: result.consistency.overall_consistency,
        fields: result.consistency.fields,
        summary: result.consistency.summary
    };

    // Database write
    const event = await prisma.assetEvent.create({
        data: {
            event_type: EventType.AI_DOCUMENT_ANALYZED,
            application_id: document.application_id,
            asset_id: null,
            performed_by: performedBy,
            metadata: metadata
        }
    });

    return {
        event_id: event.event_id,
        cached: false,
        metadata: metadata,
        raw_result: result
    };
};
