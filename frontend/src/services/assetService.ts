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
}

export type CreateAssetInput = Omit<Partial<LandAsset>, 'asset_id' | 'created_by' | 'created_at' | 'updated_at'>;
export type UpdateAssetInput = CreateAssetInput;

export interface AssetResponse {
  status: string;
  data: LandAsset;
}

export interface AssetsListResponse {
  status: string;
  data: LandAsset[];
}

export interface DeleteResponse {
  status: string;
  message: string;
}

export async function getAssets(): Promise<AssetsListResponse | null> {
  return apiRequest<AssetsListResponse>('/assets');
}

export async function getAssetById(assetId: string): Promise<AssetResponse | null> {
  return apiRequest<AssetResponse>(`/assets/${assetId}`);
}

export async function createAsset(data: CreateAssetInput): Promise<AssetResponse | null> {
  return apiRequest<AssetResponse>('/assets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAsset(assetId: string, data: UpdateAssetInput): Promise<AssetResponse | null> {
  return apiRequest<AssetResponse>(`/assets/${assetId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAsset(assetId: string): Promise<DeleteResponse | null> {
  return apiRequest<DeleteResponse>(`/assets/${assetId}`, {
    method: 'DELETE',
  });
}
