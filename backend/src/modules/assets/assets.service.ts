import prisma from '../../config/database';
import { Prisma, AssetStatus } from '@prisma/client';

// Temporary development-safe approach for created_by
// Since authentication is not implemented yet, we ensure at least one user exists
// to satisfy the foreign key constraint on LandAsset.created_by.
async function getDefaultUserId(): Promise<string> {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Dev Default User',
        email: 'dev@example.com',
        password_hash: 'dummy_hash',
      }
    });
  }
  return user.user_id;
}

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

export const createAsset = async (data: Omit<Prisma.LandAssetCreateInput, 'creator'>) => {
  const userId = await getDefaultUserId();
  
  // Inject the user relation
  const createData: Prisma.LandAssetCreateInput = {
    ...data,
    creator: {
      connect: { user_id: userId }
    }
  };

  // Remove created_by if passed manually to avoid conflicts
  if ('created_by' in createData as any) {
    delete (createData as any).created_by;
  }

  return prisma.landAsset.create({
    data: createData
  });
};

export const updateAsset = async (assetId: string, data: Prisma.LandAssetUpdateInput) => {
  // Prevent updating created_by directly via standard CRUD
  const updateData = { ...data };
  if ('created_by' in updateData) {
    delete (updateData as any).created_by;
  }

  return prisma.landAsset.update({
    where: { asset_id: assetId },
    data: updateData
  });
};

export const deleteAsset = async (assetId: string) => {
  return prisma.landAsset.delete({
    where: { asset_id: assetId }
  });
};
