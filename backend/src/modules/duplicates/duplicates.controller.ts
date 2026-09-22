import { Request, Response, NextFunction } from 'express';
import { checkDuplicate, reviewDuplicateFlag } from './duplicates.service';
import { ReviewStatus } from '@prisma/client';


export const checkDuplicateController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { assetId, candidateAssetId } = req.body;

        if (!assetId || !candidateAssetId) {
            res.status(400).json({
                status: 'error',
                message: 'assetId and candidateAssetId are required'
            });
            return;
        }

        const result = await checkDuplicate(assetId, candidateAssetId);

        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const reviewDuplicateController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { flagId } = req.params;
        const { review_status, remarks } = req.body;
        const userId = (req as any).user?.user_id;

        if (!flagId) {
            res.status(400).json({
                status: 'error',
                message: 'flagId is required'
            });
            return;
        }

        if (!userId) {
            res.status(401).json({
                status: 'error',
                message: 'Unauthorized'
            });
            return;
        }

        if (!review_status || !Object.values(ReviewStatus).includes(review_status)) {
            res.status(400).json({
                status: 'error',
                message: 'Valid review_status is required'
            });
            return;
        }

        const result = await reviewDuplicateFlag(flagId, userId, review_status as ReviewStatus, remarks);

        if (!result) {
            res.status(404).json({
                status: 'error',
                message: 'Duplicate flag not found'
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        next(error);
    }
};