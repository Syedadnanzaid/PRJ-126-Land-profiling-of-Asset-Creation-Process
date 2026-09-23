import { Request, Response, NextFunction } from 'express';
import * as assetsService from './assets.service';

export const getAllAssets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, assetType } = req.query;

    const assets = await assetsService.getAllAssets({
      search: search as string,
      assetType: assetType as string
    });
    res.status(200).json({ status: 'success', data: assets });
  } catch (error) {
    next(error);
  }
};

export const getAssetById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assetId } = req.params;
    const asset = await assetsService.getAssetById(assetId);
    if (!asset) {
      return res.status(404).json({ status: 'error', message: 'Land asset not found' });
    }
    res.status(200).json({ status: 'success', data: asset });
  } catch (error) {
    next(error);
  }
};
