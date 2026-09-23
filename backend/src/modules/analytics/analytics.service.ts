import prisma from '../../config/database';
import { ApplicationStatus, ReviewStatus } from '@prisma/client';

export const getDashboardAnalytics = async () => {
  // 1. Statistics
  const totalAssets = await prisma.landAsset.count();
  
  const pendingReview = await prisma.landApplication.count({
    where: { status: ApplicationStatus.UNDER_REVIEW }
  });
  
  const approvedAssets = await prisma.landAsset.count(); // All LandAssets are approved records
  
  const pendingWorkflows = await prisma.landApplication.count({
    where: {
      status: {
        in: [
          ApplicationStatus.SUBMITTED,
          ApplicationStatus.UNDER_REVIEW,
          ApplicationStatus.VERIFIED,
          ApplicationStatus.PENDING_APPROVAL
        ]
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
  const workflowStatusRaw = await prisma.landApplication.groupBy({
    by: ['status'],
    _count: { status: true }
  });
  
  const getCountForStatus = (status: ApplicationStatus | 'APPROVED') => {
    if (status === 'APPROVED') {
      return approvedAssets;
    }
    const found = workflowStatusRaw.find(s => s.status === status);
    return found ? found._count.status : 0;
  };

  const workflowStatus = {
    newSubmissions: getCountForStatus(ApplicationStatus.DRAFT),
    underVerification: getCountForStatus(ApplicationStatus.UNDER_REVIEW),
    sentForApproval: getCountForStatus(ApplicationStatus.PENDING_APPROVAL),
    approved: getCountForStatus('APPROVED'),
    rejected: getCountForStatus(ApplicationStatus.REJECTED)
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
      asset_type: true
    }
  });

  const geographicAssets = geographicAssetsRaw.map(asset => ({
    asset_id: asset.asset_id,
    latitude: asset.latitude as number,
    longitude: asset.longitude as number,
    status: 'APPROVED', // Keep contract stable for frontend
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
      created_at: true
    }
  });

  const recentAssets = recentAssetsRaw.map(asset => ({
    ...asset,
    status: 'APPROVED', // Keep contract stable for frontend
    created_at: asset.created_at.toISOString()
  }));

  // 6. Recent Activities
  const recentActivitiesRaw = await prisma.assetEvent.findMany({
    orderBy: { created_at: 'desc' },
    take: 5,
    select: {
      event_id: true,
      asset_id: true,
      application_id: true,
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
