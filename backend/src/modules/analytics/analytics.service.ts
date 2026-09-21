import prisma from '../../config/database';
import { AssetStatus, ReviewStatus } from '@prisma/client';

export const getDashboardAnalytics = async () => {
  // 1. Statistics
  const totalAssets = await prisma.landAsset.count();
  
  const pendingReview = await prisma.landAsset.count({
    where: { status: AssetStatus.UNDER_REVIEW }
  });
  
  const approvedAssets = await prisma.landAsset.count({
    where: { status: AssetStatus.APPROVED }
  });
  
  const pendingWorkflows = await prisma.landAsset.count({
    where: {
      status: {
        in: [AssetStatus.SUBMITTED, AssetStatus.UNDER_REVIEW]
      }
    }
  });
  
  const duplicateFlags = await prisma.duplicateFlag.count({
    where: {
      review_status: { not: ReviewStatus.DISMISSED }
    }
  });

  // 2. Asset Distribution
  const distributionRaw = await prisma.landAsset.groupBy({
    by: ['asset_type'],
    _count: { _all: true }
  });
  
  const distribution = distributionRaw.map(item => ({
    assetType: item.asset_type || 'Unknown',
    count: item._count._all
  }));

  // 3. Workflow Status
  const workflowStatusRaw = await prisma.landAsset.groupBy({
    by: ['status'],
    _count: { status: true }
  });
  
  const getCountForStatus = (status: AssetStatus) => {
    const found = workflowStatusRaw.find(s => s.status === status);
    return found ? found._count.status : 0;
  };

  const workflowStatus = {
    newSubmissions: getCountForStatus(AssetStatus.DRAFT),
    underVerification: getCountForStatus(AssetStatus.UNDER_REVIEW),
    sentForApproval: getCountForStatus(AssetStatus.SUBMITTED),
    approved: getCountForStatus(AssetStatus.APPROVED),
    rejected: getCountForStatus(AssetStatus.REJECTED)
  };

  // 4. Geographic Assets
  const geographicAssetsRaw = await prisma.landAsset.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null }
    },
    select: {
      asset_id: true,
      latitude: true,
      longitude: true,
      status: true,
      asset_type: true
    }
  });

  const geographicAssets = geographicAssetsRaw.map(asset => ({
    asset_id: asset.asset_id,
    latitude: asset.latitude as number,
    longitude: asset.longitude as number,
    status: asset.status,
    asset_type: asset.asset_type
  }));

  // 5. Recent Assets
  const recentAssetsRaw = await prisma.landAsset.findMany({
    orderBy: { created_at: 'desc' },
    take: 5,
    select: {
      asset_id: true,
      land_id: true,
      survey_no: true,
      owner_name: true,
      latitude: true,
      longitude: true,
      asset_type: true,
      area: true,
      status: true,
      created_at: true
    }
  });

  const recentAssets = recentAssetsRaw.map(asset => ({
    ...asset,
    created_at: asset.created_at.toISOString()
  }));

  // 6. Recent Activities
  const recentActivitiesRaw = await prisma.assetEvent.findMany({
    orderBy: { created_at: 'desc' },
    take: 5,
    select: {
      event_id: true,
      asset_id: true,
      event_type: true,
      metadata: true,
      created_at: true
    }
  });

  const recentActivities = recentActivitiesRaw.map(event => ({
    ...event,
    created_at: event.created_at.toISOString()
  }));

  return {
    statistics: {
      totalAssets,
      pendingReview,
      duplicateFlags,
      approvedAssets,
      pendingWorkflows
    },
    distribution,
    workflowStatus,
    geographicAssets,
    recentAssets,
    recentActivities
  };
};
