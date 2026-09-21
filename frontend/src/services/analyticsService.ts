import { apiRequest } from './api';

export interface DashboardStatistics {
  totalAssets: number;
  pendingReview: number;
  duplicateFlags: number;
  approvedAssets: number;
  pendingWorkflows: number;
}

export interface DashboardDistribution {
  assetType: string;
  count: number;
}

export interface DashboardWorkflowStatus {
  newSubmissions: number;
  underVerification: number;
  sentForApproval: number;
  approved: number;
  rejected: number;
}

export interface DashboardGeographicAsset {
  asset_id: string;
  latitude: number;
  longitude: number;
  status: string;
  asset_type: string | null;
}

export interface DashboardRecentAsset {
  asset_id: string;
  survey_no: string | null;
  asset_type: string | null;
  status: string;
  created_at: string;
}

// Note: Using any[] for recentActivities since it's currently empty array in API response
// and no type shape is yet provided for AssetEvent.
export interface DashboardAnalytics {
  statistics: DashboardStatistics;
  distribution: DashboardDistribution[];
  workflowStatus: DashboardWorkflowStatus;
  geographicAssets: DashboardGeographicAsset[];
  recentAssets: DashboardRecentAsset[];
  recentActivities: unknown[];
}

export interface AnalyticsResponse {
  status: string;
  data: DashboardAnalytics;
}

export const getDashboardAnalytics = async (): Promise<DashboardAnalytics> => {
  const response = await apiRequest<AnalyticsResponse>('/analytics/dashboard');
  
  if (!response || !response.data) {
    throw new Error('Failed to load dashboard analytics: invalid response format');
  }

  return response.data;
};
