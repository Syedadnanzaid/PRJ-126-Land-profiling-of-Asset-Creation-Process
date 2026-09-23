import prisma from '../../config/database';
import { Prisma } from '@prisma/client';

export const getAllAssets = async (filters: { search?: string; assetType?: string }) => {
  const where: Prisma.LandAssetWhereInput = {};

  if (filters.search) {
    where.OR = [
      { survey_no: { contains: filters.search, mode: 'insensitive' } },
      { owner_name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  if (filters.assetType) {
    where.asset_type = { contains: filters.assetType, mode: 'insensitive' };
  }

  return prisma.landAsset.findMany({
    where,
    orderBy: { created_at: 'desc' }
  });
};

export const getAssetById = async (assetId: string) => {
  return prisma.landAsset.findUnique({
    where: { asset_id: assetId },
    include: {
      events: {
        orderBy: { created_at: 'desc' }
      }
    }
  });
};
