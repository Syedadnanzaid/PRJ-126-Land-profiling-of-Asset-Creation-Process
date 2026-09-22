import { Request, Response, NextFunction } from 'express';
import { checkDuplicate } from './duplicates.service';

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