import { PrismaClient, AssetStatus, EventType } from '@prisma/client';

const prisma = new PrismaClient();

export const processTransition = async (
  assetId: string,
  userId: string,
  expectedStatus: AssetStatus,
  newStatus: AssetStatus,
  remarks?: string
) => {
  return await prisma.$transaction(async (tx) => {
    const asset = await tx.landAsset.findUnique({
      where: { asset_id: assetId }
    });

    if (!asset) {
      throw new Error('Land asset not found');
    }

    if (asset.status !== expectedStatus) {
      throw new Error(`Invalid state transition. Asset is in ${asset.status} state, expected ${expectedStatus}`);
    }

    // Update the asset status
    const updatedAsset = await tx.landAsset.update({
      where: { asset_id: assetId },
      data: { status: newStatus }
    });

    // Create workflow history record
    const history = await tx.workflowHistory.create({
      data: {
        asset_id: assetId,
        previous_status: expectedStatus,
        new_status: newStatus,
        action_by: userId,
        remarks: remarks || null
      }
    });

    // Create asset event for the transition
    await tx.assetEvent.create({
      data: {
        asset_id: assetId,
        event_type: EventType.STATUS_CHANGED,
        performed_by: userId,
        metadata: {
          previous_status: expectedStatus,
          new_status: newStatus,
          remarks: remarks || null
        }
      }
    });

    return { asset: updatedAsset, history };
  });
};
