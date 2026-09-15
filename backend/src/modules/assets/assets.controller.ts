import { Request, Response, NextFunction } from 'express';
import * as assetsService from './assets.service';
import { AssetStatus } from '@prisma/client';

export const getAllAssets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, status, assetType } = req.query;

    if (status !== undefined && !(Object.values(AssetStatus) as string[]).includes(status as string)) {
      return res.status(400).json({ status: 'error', message: 'Invalid status value' });
    }

    const assets = await assetsService.getAllAssets({
      search: search as string,
      status: status as AssetStatus,
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

export const createAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { area, latitude, longitude, status } = req.body;

    // Manual Validation
    if (area !== undefined && (typeof area !== 'number' || area <= 0)) {
      return res.status(400).json({ status: 'error', message: 'Area must be a positive number' });
    }
    if (latitude !== undefined && (typeof latitude !== 'number' || latitude < -90 || latitude > 90)) {
      return res.status(400).json({ status: 'error', message: 'Latitude must be between -90 and 90' });
    }
    if (longitude !== undefined && (typeof longitude !== 'number' || longitude < -180 || longitude > 180)) {
      return res.status(400).json({ status: 'error', message: 'Longitude must be between -180 and 180' });
    }
    if (status !== undefined && !Object.values(AssetStatus).includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Invalid status value' });
    }

    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const newAsset = await assetsService.createAsset(req.user.user_id, req.body);
    res.status(201).json({ status: 'success', data: newAsset });
  } catch (error) {
    next(error);
  }
};

export const updateAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assetId } = req.params;
    
    // Validate existence
    const existing = await assetsService.getAssetById(assetId);
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Land asset not found' });
    }

    const { area, latitude, longitude, status } = req.body;

    // Manual Validation
    if (area !== undefined && (typeof area !== 'number' || area <= 0)) {
      return res.status(400).json({ status: 'error', message: 'Area must be a positive number' });
    }
    if (latitude !== undefined && (typeof latitude !== 'number' || latitude < -90 || latitude > 90)) {
      return res.status(400).json({ status: 'error', message: 'Latitude must be between -90 and 90' });
    }
    if (longitude !== undefined && (typeof longitude !== 'number' || longitude < -180 || longitude > 180)) {
      return res.status(400).json({ status: 'error', message: 'Longitude must be between -180 and 180' });
    }
    if (status !== undefined && !Object.values(AssetStatus).includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Invalid status value' });
    }

    const updatedAsset = await assetsService.updateAsset(assetId, req.body);
    res.status(200).json({ status: 'success', data: updatedAsset });
  } catch (error) {
    next(error);
  }
};

export const deleteAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assetId } = req.params;
    
    const existing = await assetsService.getAssetById(assetId);
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Land asset not found' });
    }

    await assetsService.deleteAsset(assetId);
    res.status(200).json({ status: 'success', message: 'Land asset deleted successfully' });
  } catch (error) {
    next(error);
  }
};
