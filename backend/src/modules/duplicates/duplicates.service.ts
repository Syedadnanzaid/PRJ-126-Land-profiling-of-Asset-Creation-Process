import prisma from '../../config/database';

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
    assetId: string,
    candidateAssetId: string
) => {
    const [asset, matchedAsset] = await Promise.all([
        prisma.landAsset.findUnique({
            where: { asset_id: assetId }
        }),
        prisma.landAsset.findUnique({
            where: { asset_id: candidateAssetId }
        })
    ]);

    if (!asset) {
        throw new Error('Target asset not found');
    }

    if (!matchedAsset) {
        throw new Error('Candidate asset not found');
    }

    if (assetId === candidateAssetId) {
        throw new Error('An asset cannot be compared with itself');
    }

    const response = await fetch(`${AI_API_URL}/predict`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            asset_a: asset,
            asset_b: matchedAsset
        })
    });

    if (!response.ok) {
        throw new Error(`AI service returned HTTP ${response.status}`);
    }

    const aiResult = (await response.json()) as AIResponse;

    const duplicateFlag = await prisma.duplicateFlag.create({
        data: {
            asset_id: assetId,
            matched_asset_id: candidateAssetId,
            similarity_score: aiResult.duplicate_probability,
            survey_similarity: aiResult.features.survey_similarity,
            owner_similarity: aiResult.features.owner_similarity,
            area_similarity: aiResult.features.area_similarity,
            location_similarity: aiResult.features.location_similarity,
            reason: aiResult.reason
        }
    });

    return {
        flag: duplicateFlag,
        ai_result: aiResult
    };
};