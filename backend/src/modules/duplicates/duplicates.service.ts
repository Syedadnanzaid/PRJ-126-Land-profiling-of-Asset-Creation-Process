import prisma from '../../config/database';
import { ApplicationStatus, ReviewStatus, EventType } from '@prisma/client';

const AI_API_URL = process.env.AI_API_URL || 'http://127.0.0.1:8000';

interface AIResponse {
    duplicate_probability: number;
    is_duplicate: boolean;
    features: {
        survey_similarity: number;
        owner_similarity: number;
        area_similarity: number;
        location_similarity: number;
        land_id_similarity: number;
        asset_type_match: number;
        description_similarity: number;
        coordinate_validity: number;
    };
    reason: string;
}

export const checkDuplicate = async (
    applicationId: string,
    candidateAssetId: string,
    userId: string
) => {
    const application = await prisma.landApplication.findUnique({
        where: { application_id: applicationId }
    });

    if (!application) {
        throw new Error('Target application not found');
    }

    const validStatuses: ApplicationStatus[] = [
        ApplicationStatus.UNDER_REVIEW,
        ApplicationStatus.VERIFIED,
        ApplicationStatus.PENDING_APPROVAL
    ];

    if (!validStatuses.includes(application.status)) {
        throw new Error('Application must be UNDER_REVIEW, VERIFIED, or PENDING_APPROVAL for duplicate checks');
    }

    const matchedAsset = await prisma.landAsset.findUnique({
        where: { asset_id: candidateAssetId }
    });

    if (!matchedAsset) {
        throw new Error('Candidate official asset not found');
    }

    // Prepare controlled payload mapping
    const aiPayload = {
        asset_a: {
            // Mapping application fields to expected LandAsset format for AI
            land_id: null,
            survey_no: application.survey_no,
            owner_name: application.owner_name,
            area: application.area,
            latitude: application.latitude,
            longitude: application.longitude,
            asset_type: application.asset_type,
            description: application.description
        },
        asset_b: {
            land_id: matchedAsset.land_id,
            survey_no: matchedAsset.survey_no,
            owner_name: matchedAsset.owner_name,
            area: matchedAsset.area,
            latitude: matchedAsset.latitude,
            longitude: matchedAsset.longitude,
            asset_type: matchedAsset.asset_type,
            description: matchedAsset.description
        }
    };

    const response = await fetch(`${AI_API_URL}/predict`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(aiPayload)
    });

    if (!response.ok) {
        throw new Error(`AI service returned HTTP ${response.status}`);
    }

    const aiResult = (await response.json()) as AIResponse;

    // Validate AI Response
    if (typeof aiResult.duplicate_probability !== 'number' || aiResult.duplicate_probability < 0 || aiResult.duplicate_probability > 1) {
        throw new Error('Invalid duplicate_probability from AI');
    }
    if (!aiResult.features || typeof aiResult.features.survey_similarity !== 'number') {
        throw new Error('Invalid features from AI');
    }

    const result = await prisma.$transaction(async (tx) => {
        const duplicateFlag = await tx.duplicateFlag.create({
            data: {
                application_id: applicationId,
                matched_asset_id: candidateAssetId,
                similarity_score: aiResult.duplicate_probability,
                survey_similarity: aiResult.features.survey_similarity,
                owner_similarity: aiResult.features.owner_similarity,
                area_similarity: aiResult.features.area_similarity,
                location_similarity: aiResult.features.location_similarity,
                reason: aiResult.reason,
                review_status: ReviewStatus.PENDING
            }
        });

        await tx.assetEvent.create({
            data: {
                event_type: EventType.AI_DUPLICATE_CHECKED,
                application_id: applicationId,
                asset_id: candidateAssetId,
                performed_by: userId,
                metadata: {
                    duplicate_probability: aiResult.duplicate_probability,
                    matched_asset_id: candidateAssetId,
                    flag_id: duplicateFlag.flag_id,
                    reason: aiResult.reason
                }
            }
        });

        return duplicateFlag;
    });

    return {
        flag: result,
        ai_result: aiResult
    };
};

export const reviewDuplicateFlag = async (
    flagId: string,
    userId: string,
    reviewStatus: ReviewStatus,
    remarks?: string
) => {
    const flag = await prisma.duplicateFlag.findUnique({
        where: { flag_id: flagId },
        include: { application: true }
    });

    if (!flag) {
        throw new Error('Duplicate flag not found');
    }

    if (flag.review_status !== ReviewStatus.PENDING) {
        throw new Error('Only PENDING duplicate flags can be reviewed');
    }

    const validReviewStatuses: ReviewStatus[] = [ReviewStatus.CONFIRMED, ReviewStatus.DISMISSED];
    if (!validReviewStatuses.includes(reviewStatus)) {
        throw new Error('Flag can only be transitioned to CONFIRMED or DISMISSED');
    }

    if (reviewStatus === ReviewStatus.DISMISSED && (!remarks || remarks.trim() === '')) {
        throw new Error('Remarks are required when dismissing a duplicate flag');
    }

    const updatedFlag = await prisma.duplicateFlag.update({
        where: { flag_id: flagId },
        data: {
            review_status: reviewStatus,
            reviewed_by: userId,
            reviewed_at: new Date(),
            remarks: remarks || null
        }
    });

    return updatedFlag;
};

export const runAutomaticDuplicateScan = async (
    applicationId: string,
    performedBy: string
) => {
    const application = await prisma.landApplication.findUnique({
        where: { application_id: applicationId }
    });

    if (!application) return;

    const officialAssets = await prisma.landAsset.findMany();

    for (const asset of officialAssets) {
        try {
            const aiPayload = {
                asset_a: {
                    land_id: null,
                    survey_no: application.survey_no,
                    owner_name: application.owner_name,
                    area: application.area,
                    latitude: application.latitude,
                    longitude: application.longitude,
                    asset_type: application.asset_type,
                    description: application.description
                },
                asset_b: {
                    land_id: asset.land_id,
                    survey_no: asset.survey_no,
                    owner_name: asset.owner_name,
                    area: asset.area,
                    latitude: asset.latitude,
                    longitude: asset.longitude,
                    asset_type: asset.asset_type,
                    description: asset.description
                }
            };
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            let response;
            try {
                response = await fetch(`${AI_API_URL}/predict`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(aiPayload),
                    signal: controller.signal
                });
            } finally {
                clearTimeout(timeoutId);
            }

            if (!response.ok) {
                console.error(`[AI] Service returned HTTP ${response.status} for asset ${asset.asset_id}`);
                continue;
            }

            const aiResult = (await response.json()) as AIResponse;

            if (typeof aiResult.duplicate_probability !== 'number' || 
                !isFinite(aiResult.duplicate_probability) || 
                aiResult.duplicate_probability < 0 || 
                aiResult.duplicate_probability > 1) {
                console.error(`[AI] Invalid duplicate_probability from AI for asset ${asset.asset_id}`);
                continue;
            }

            if (!aiResult.features || typeof aiResult.features.survey_similarity !== 'number') {
                console.error(`[AI] Invalid features from AI for asset ${asset.asset_id}`);
                continue;
            }

            if (aiResult.is_duplicate === true) {
                const existingFlag = await prisma.duplicateFlag.findFirst({
                    where: {
                        application_id: applicationId,
                        matched_asset_id: asset.asset_id
                    }
                });

                if (existingFlag) {
                    continue;
                }

                await prisma.$transaction(async (tx) => {
                    await tx.duplicateFlag.create({
                        data: {
                            application_id: applicationId,
                            matched_asset_id: asset.asset_id,
                            similarity_score: aiResult.duplicate_probability,
                            survey_similarity: aiResult.features.survey_similarity,
                            owner_similarity: aiResult.features.owner_similarity,
                            area_similarity: aiResult.features.area_similarity,
                            location_similarity: aiResult.features.location_similarity,
                            reason: aiResult.reason,
                            review_status: ReviewStatus.PENDING,
                            reviewed_by: null,
                            reviewed_at: null,
                            remarks: null
                        }
                    });

                    await tx.assetEvent.create({
                        data: {
                            event_type: EventType.AI_DUPLICATE_CHECKED,
                            application_id: applicationId,
                            asset_id: null,
                            performed_by: performedBy,
                            metadata: {
                                matched_asset_id: asset.asset_id,
                                duplicate_probability: aiResult.duplicate_probability,
                                is_duplicate: true,
                                features: {
                                    survey_similarity: aiResult.features.survey_similarity,
                                    owner_similarity: aiResult.features.owner_similarity,
                                    area_similarity: aiResult.features.area_similarity,
                                    location_similarity: aiResult.features.location_similarity
                                },
                                reason: aiResult.reason
                            }
                        }
                    });
                });
            }
        } catch (error) {
            console.error(`[AI] Prediction failed for candidate ${asset.asset_id}:`, error);
        }
    }
};