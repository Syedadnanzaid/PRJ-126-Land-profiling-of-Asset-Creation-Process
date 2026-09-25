import { apiRequest, API_BASE_URL } from './api';

export type ApplicationStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CORRECTION_REQUIRED'
  | 'VERIFIED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED';

export interface LandApplication {
  application_id: string;
  applicant_id: string;
  land_id?: string | null;
  survey_no?: string | null;
  owner_name?: string | null;
  asset_type?: string | null;
  description?: string | null;
  area?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  documents?: Document[];
  workflow?: WorkflowHistory[];
  duplicate_flags?: DuplicateFlag[];
}

export interface Document {
  document_id: string;
  application_id: string;
  file_name: string;
  document_type: string;
  file_path: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface WorkflowHistory {
  history_id: string;
  application_id: string;
  action_by: string;
  previous_status?: string | null;
  new_status: string;
  remarks?: string | null;
  action_time: string;
}

export interface DuplicateFlag {
  flag_id: string;
  application_id: string;
  candidate_asset_id: string;
  similarity_score: number;
  review_status: string;
  remarks?: string | null;
  created_at: string;
  resolved_at?: string | null;
  resolved_by?: string | null;
}

export interface ApplicationResponse {
  status: string;
  data: LandApplication;
}

export interface ApplicationsListResponse {
  status: string;
  data: LandApplication[];
}

export interface DocumentResponse {
  status: string;
  data: Document;
}

export interface DocumentsListResponse {
  status: string;
  data: Document[];
}

export interface DuplicateFlagResponse {
  status: string;
  data: DuplicateFlag;
}

// --- Application CRUD ---

export async function getApplications(): Promise<ApplicationsListResponse | null> {
  return apiRequest<ApplicationsListResponse>('/applications');
}

export interface ApprovalStatsResponse {
  status: string;
  data: {
    pendingApproval: number;
    approved: number;
    rejected: number;
  };
}

export async function getApprovalStats(): Promise<ApprovalStatsResponse | null> {
  return apiRequest<ApprovalStatsResponse>('/applications/approval-stats');
}

export async function getApplicationById(applicationId: string): Promise<ApplicationResponse | null> {
  return apiRequest<ApplicationResponse>(`/applications/${applicationId}`);
}

export async function createApplication(data: Partial<LandApplication>): Promise<ApplicationResponse | null> {
  return apiRequest<ApplicationResponse>('/applications', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateApplication(applicationId: string, data: Partial<LandApplication>): Promise<ApplicationResponse | null> {
  return apiRequest<ApplicationResponse>(`/applications/${applicationId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// --- Workflow ---

export async function submitApplication(applicationId: string, remarks?: string): Promise<ApplicationResponse | null> {
  return apiRequest<ApplicationResponse>(`/applications/${applicationId}/workflow/submit`, {
    method: 'POST',
    body: JSON.stringify({ remarks }),
  });
}

export async function startVerification(applicationId: string): Promise<ApplicationResponse | null> {
  return apiRequest<ApplicationResponse>(`/applications/${applicationId}/workflow/verify/start`, {
    method: 'POST',
  });
}

export async function requestCorrection(applicationId: string, remarks: string): Promise<ApplicationResponse | null> {
  return apiRequest<ApplicationResponse>(`/applications/${applicationId}/workflow/verify/request-correction`, {
    method: 'POST',
    body: JSON.stringify({ remarks }),
  });
}

export async function resubmitApplication(applicationId: string, remarks?: string): Promise<ApplicationResponse | null> {
  return apiRequest<ApplicationResponse>(`/applications/${applicationId}/workflow/resubmit`, {
    method: 'POST',
    body: JSON.stringify({ remarks }),
  });
}

export async function completeVerification(applicationId: string): Promise<ApplicationResponse | null> {
  return apiRequest<ApplicationResponse>(`/applications/${applicationId}/workflow/verify/complete`, {
    method: 'POST',
  });
}

export async function requestApproval(applicationId: string): Promise<ApplicationResponse | null> {
  return apiRequest<ApplicationResponse>(`/applications/${applicationId}/workflow/approval/request`, {
    method: 'POST',
  });
}

export async function approveApplication(applicationId: string, remarks?: string): Promise<ApplicationResponse | null> {
  return apiRequest<ApplicationResponse>(`/applications/${applicationId}/workflow/approval/approve`, {
    method: 'POST',
    body: JSON.stringify({ remarks }),
  });
}

export async function rejectApplication(applicationId: string, remarks: string): Promise<ApplicationResponse | null> {
  return apiRequest<ApplicationResponse>(`/applications/${applicationId}/workflow/approval/reject`, {
    method: 'POST',
    body: JSON.stringify({ remarks }),
  });
}

// --- Documents ---

export async function getApplicationDocuments(applicationId: string): Promise<DocumentsListResponse | null> {
  return apiRequest<DocumentsListResponse>(`/applications/${applicationId}/documents`);
}

export async function uploadApplicationDocument(applicationId: string, formData: FormData): Promise<DocumentResponse | null> {
  // Using native fetch for FormData to allow the browser to set the multipart boundary automatically
  const token = localStorage.getItem('token');
  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/documents`, {
    method: 'POST',
    headers,
    body: formData,
  });
  
  let data = null;
  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.includes('application/json')) {
    try { data = await response.json(); } catch (e) { /* ignore */ }
  }
  
  if (!response.ok) {
    let errorMessage = 'API request failed';
    if (data && typeof data === 'object' && 'message' in data) {
      errorMessage = String((data as { message: unknown }).message);
    }
    throw new Error(errorMessage);
  }
  
  return data as DocumentResponse;
}

export async function downloadDocument(documentId: string): Promise<Blob> {
  const token = localStorage.getItem('token');
  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const response = await fetch(`${API_BASE_URL}/documents/${documentId}/download`, {
    headers,
  });
  
  if (!response.ok) {
    throw new Error('Failed to download document');
  }
  
  return response.blob();
}

export async function deleteDocument(documentId: string): Promise<{status: string, message: string} | null> {
  return apiRequest<{status: string, message: string}>(`/documents/${documentId}`, {
    method: 'DELETE',
  });
}

// --- Duplicates ---

export async function checkApplicationDuplicate(applicationId: string, candidateAssetId: string): Promise<DuplicateFlagResponse | null> {
  return apiRequest<DuplicateFlagResponse>(`/applications/${applicationId}/duplicates/check`, {
    method: 'POST',
    body: JSON.stringify({ candidate_asset_id: candidateAssetId }),
  });
}

export async function reviewDuplicate(flagId: string, reviewStatus: string, remarks?: string): Promise<DuplicateFlagResponse | null> {
  return apiRequest<DuplicateFlagResponse>(`/duplicates/${flagId}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ review_status: reviewStatus, remarks }),
  });
}
