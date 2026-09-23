import { Request, Response, NextFunction } from 'express';
import { checkDuplicate, reviewDuplicateFlag } from './duplicates.service';
import { ReviewStatus } from '@prisma/client';


export const checkDuplicateController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { applicationId } = req.params;
        const { candidateAssetId } = req.body;
        const userId = (req as any).user?.user_id;

        if (!applicationId || !candidateAssetId) {
            res.status(400).json({
                status: 'error',
                message: 'applicationId and candidateAssetId are required'
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

        const result = await checkDuplicate(applicationId, candidateAssetId, userId);

        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error: any) {
        if (error.message.includes('not found')) {
             res.status(404).json({ status: 'error', message: error.message });
             return;
        }
        if (error.message.includes('must be UNDER_REVIEW') || error.message.includes('Invalid')) {
             res.status(400).json({ status: 'error', message: error.message });
             return;
        }
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

        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error: any) {
        if (error.message === 'Duplicate flag not found') {
            res.status(404).json({ status: 'error', message: error.message });
            return;
        }
        if (error.message.includes('Only PENDING') || error.message.includes('Flag can only') || error.message.includes('Remarks are required')) {
            res.status(400).json({ status: 'error', message: error.message });
            return;
        }
        next(error);
    }
};