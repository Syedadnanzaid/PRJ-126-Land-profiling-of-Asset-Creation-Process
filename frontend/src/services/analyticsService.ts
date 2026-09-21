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
  area: number | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  created_at: string;
}

export interface DashboardActivity {
  event_id: string;
  asset_id: string;
  event_type: string;
  metadata: any;
  created_at: string;
}

export interface DashboardAnalytics {
  statistics: DashboardStatistics;
  distribution: DashboardDistribution[];
  workflowStatus: DashboardWorkflowStatus;
  geographicAssets: DashboardGeographicAsset[];
  recentAssets: DashboardRecentAsset[];
  recentActivities: DashboardActivity[];
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
