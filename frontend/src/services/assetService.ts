import { apiRequest } from './api';

export type AssetStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface LandAsset {
  asset_id: string;
  land_id?: string | null;
  survey_no?: string | null;
  owner_name?: string | null;
  area?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  asset_type?: string | null;
  description?: string | null;
  status: AssetStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  events?: any[];
  documents?: any[];
}

export interface AssetResponse {
  status: string;
  data: LandAsset;
}

export interface AssetsListResponse {
  status: string;
  data: LandAsset[];
}

export async function getAssets(): Promise<AssetsListResponse | null> {
  return apiRequest<AssetsListResponse>('/assets');
}

export async function getAssetById(assetId: string): Promise<AssetResponse | null> {
  return apiRequest<AssetResponse>(`/assets/${assetId}`);
}

// --- Workflow Actions ---

export async function submitAssetForReview(assetId: string, remarks?: string): Promise<AssetResponse | null> {
  return apiRequest<AssetResponse>(`/assets/${assetId}/workflow/submit`, {
    method: 'POST',
    body: JSON.stringify({ remarks }),
  });
}

export async function startAssetReview(assetId: string, remarks?: string): Promise<AssetResponse | null> {
  return apiRequest<AssetResponse>(`/assets/${assetId}/workflow/review`, {
    method: 'POST',
    body: JSON.stringify({ remarks }),
  });
}

export async function approveAsset(assetId: string, remarks?: string): Promise<AssetResponse | null> {
  return apiRequest<AssetResponse>(`/assets/${assetId}/workflow/approve`, {
    method: 'POST',
    body: JSON.stringify({ remarks }),
  });
}

export async function rejectAsset(assetId: string, remarks?: string): Promise<AssetResponse | null> {
  return apiRequest<AssetResponse>(`/assets/${assetId}/workflow/reject`, {
    method: 'POST',
    body: JSON.stringify({ remarks }),
  });
}

export async function resubmitAsset(assetId: string, remarks?: string): Promise<AssetResponse | null> {
  return apiRequest<AssetResponse>(`/assets/${assetId}/workflow/resubmit`, {
    method: 'POST',
    body: JSON.stringify({ remarks }),
  });
}
