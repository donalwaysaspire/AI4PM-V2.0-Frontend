// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  user_id: string
  username: string
  email: string
  role: UserRole
  project_ids: string[]
  is_active: boolean
  created_at: string
}

// Full profile returned by GET auth/me — includes permissions
export interface UserProfile {
  user_id: string
  username: string
  email: string
  role: UserRole
  project_ids: string[]
  permissions: string[]
}

export type UserRole =
  | 'viewer'
  | 'primary_manager'
  | 'delivery_manager'
  | 'vp'
  | 'president'
  | 'ceo'
  | 'admin'

export interface LoginCredentials {
  username: string
  password: string
}

// Raw shape returned by POST auth/login
export interface LoginApiResponse {
  access_token: string
  token_type: string
  user_id: string
  username: string
  role: string
  expires_in: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
}

export interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  isAuthenticated: boolean
}

// ─── API ─────────────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  message: string
  code: string
  status: number
}

// ─── Common ──────────────────────────────────────────────────────────────────
export interface PaginationParams {
  page: number
  pageSize: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export type Status = 'idle' | 'loading' | 'success' | 'error'

// ─── Ingestion ───────────────────────────────────────────────────────────────
export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed'
  progress: number
  url?: string
  uploadedAt: string
  uploadedBy: string
  error?: string
}

// ─── Chat ────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  isStreaming?: boolean
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

// ─── Anomaly ─────────────────────────────────────────────────────────────────
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical'
export type AnomalyStatus = 'open' | 'investigating' | 'resolved' | 'dismissed'

export interface Anomaly {
  id: string
  title: string
  description: string
  severity: AnomalySeverity
  status: AnomalyStatus
  detectedAt: string
  resolvedAt?: string
  source: string
  metadata?: Record<string, unknown>
}

// ─── Innovation ──────────────────────────────────────────────────────────────
export type InnovationStatus = 'draft' | 'review' | 'approved' | 'in_progress' | 'completed' | 'rejected'
export type InnovationCategory = 'process' | 'technology' | 'product' | 'people' | 'other'

export interface Innovation {
  id: string
  title: string
  description: string
  status: InnovationStatus
  category: InnovationCategory
  submittedBy: string
  submittedAt: string
  votes: number
  tags: string[]
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalUsers: number
  totalFiles: number
  openAnomalies: number
  activeInnovations: number
}

export interface ChartDataPoint {
  label: string
  value: number
  [key: string]: string | number
}

// ─── Managers ────────────────────────────────────────────────────────────────
export interface Manager {
  user_id: string
  username: string
  email: string
  role: UserRole
  project_ids: string[]
  manager_ids: string[]
  project_count: number
  subordinate_count: number
}

// ─── Projects ────────────────────────────────────────────────────────────────
export interface Project {
  project_name: string   // used as both id and display label
  files_uploaded: number
  docs_indexed: number
  chunks_indexed: number
  has_risk_data: boolean
}