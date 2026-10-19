import apiClient from '@/lib/apiClient'
import type { ApiResponse, PaginatedResponse, PaginationParams, UploadedFile, ChatMessage, ChatSession, Anomaly, Innovation } from '@/types'

// ─── Ingestion ───────────────────────────────────────────────────────────────
export const ingestionApi = {
  getFiles: (params: PaginationParams) =>
    apiClient.get<ApiResponse<PaginatedResponse<UploadedFile>>>('/ingestion/files', { params }),

  upload: (formData: FormData, onProgress?: (progress: number) => void) =>
    apiClient.post<ApiResponse<UploadedFile>>('/ingestion/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded * 100) / evt.total))
        }
      },
    }),

  deleteFile: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/ingestion/files/${id}`),

  reprocess: (id: string) =>
    apiClient.post<ApiResponse<UploadedFile>>(`/ingestion/files/${id}/reprocess`),
}

// ─── Chat ────────────────────────────────────────────────────────────────────
export const chatApi = {
  getSessions: () =>
    apiClient.get<ApiResponse<ChatSession[]>>('/chat/sessions'),

  getSession: (id: string) =>
    apiClient.get<ApiResponse<ChatSession>>(`/chat/sessions/${id}`),

  createSession: (title?: string) =>
    apiClient.post<ApiResponse<ChatSession>>('/chat/sessions', { title }),

  sendMessage: (sessionId: string, content: string) =>
    apiClient.post<ApiResponse<ChatMessage>>(`/chat/sessions/${sessionId}/messages`, { content }),

  deleteSession: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/chat/sessions/${id}`),
}

// ─── Anomaly ─────────────────────────────────────────────────────────────────
export const anomalyApi = {
  getAll: (params: PaginationParams & { severity?: string; status?: string }) =>
    apiClient.get<ApiResponse<PaginatedResponse<Anomaly>>>('/anomalies', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Anomaly>>(`/anomalies/${id}`),

  updateStatus: (id: string, status: string) =>
    apiClient.patch<ApiResponse<Anomaly>>(`/anomalies/${id}/status`, { status }),

  dismiss: (id: string) =>
    apiClient.patch<ApiResponse<Anomaly>>(`/anomalies/${id}/dismiss`),

  getStats: () =>
    apiClient.get<ApiResponse<Record<string, number>>>('/anomalies/stats'),
}

// ─── Innovations ─────────────────────────────────────────────────────────────
export const innovationsApi = {
  getAll: (params: PaginationParams & { status?: string; category?: string }) =>
    apiClient.get<ApiResponse<PaginatedResponse<Innovation>>>('/innovations', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Innovation>>(`/innovations/${id}`),

  create: (payload: Partial<Innovation>) =>
    apiClient.post<ApiResponse<Innovation>>('/innovations', payload),

  update: (id: string, payload: Partial<Innovation>) =>
    apiClient.put<ApiResponse<Innovation>>(`/innovations/${id}`, payload),

  vote: (id: string) =>
    apiClient.post<ApiResponse<Innovation>>(`/innovations/${id}/vote`),

  updateStatus: (id: string, status: string) =>
    apiClient.patch<ApiResponse<Innovation>>(`/innovations/${id}/status`, { status }),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/innovations/${id}`),
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardApi = {
  getStats: () =>
    apiClient.get<ApiResponse<Record<string, number>>>('/dashboard/stats'),

  getActivityChart: (range: '7d' | '30d' | '90d') =>
    apiClient.get<ApiResponse<unknown[]>>('/dashboard/activity', { params: { range } }),

  getAnomalyTrend: () =>
    apiClient.get<ApiResponse<unknown[]>>('/dashboard/anomaly-trend'),
}
