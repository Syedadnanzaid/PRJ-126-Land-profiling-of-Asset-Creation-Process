import prisma from '../../config/database';
import { Prisma, AssetStatus } from '@prisma/client';



export const getAllAssets = async (filters: { search?: string; status?: AssetStatus; assetType?: string }) => {
  const where: Prisma.LandAssetWhereInput = {};

  if (filters.search) {
    where.OR = [
      { survey_no: { contains: filters.search, mode: 'insensitive' } },
      { owner_name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  if (filters.status) {
    where.status = filters.status;
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
    where: { asset_id: assetId }
  });
};

export const createAsset = async (creatorId: string, data: Omit<Prisma.LandAssetCreateInput, 'creator'>) => {
  // Remove created_by if passed manually to avoid conflicts
  const { created_by, ...safeData } = data as Omit<Prisma.LandAssetCreateInput, 'creator'> & { created_by?: string };

  return prisma.$transaction(async (tx) => {
    const newAsset = await tx.landAsset.create({
      data: {
        ...safeData,
        creator: {
          connect: { user_id: creatorId }
        }
      }
    });

    await tx.assetEvent.create({
      data: {
        asset_id: newAsset.asset_id,
        event_type: 'ASSET_CREATED',
        performed_by: creatorId,
        metadata: {
          land_id: newAsset.land_id,
          survey_no: newAsset.survey_no,
          asset_type: newAsset.asset_type
        }
      }
    });

    return newAsset;
  });
};

export const updateAsset = async (assetId: string, data: Prisma.LandAssetUpdateInput) => {
  // Prevent updating created_by directly via standard CRUD
  const { created_by, ...safeData } = data as Prisma.LandAssetUpdateInput & { created_by?: string };

  return prisma.landAsset.update({
    where: { asset_id: assetId },
    data: safeData
  });
};

export const deleteAsset = async (assetId: string) => {
  return prisma.landAsset.delete({
    where: { asset_id: assetId }
  });
};
