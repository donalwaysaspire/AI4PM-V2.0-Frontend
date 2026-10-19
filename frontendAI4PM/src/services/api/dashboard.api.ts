import apiClient from '@/lib/apiClient'

export interface DashboardProject {
  project_name:         string
  files_uploaded:       number
  docs_indexed:         number
  chunks_indexed:       number
  has_risk_data:        boolean
  risk_score:           number | null
  risk_tier:            string | null
  risk_top_drivers:     string[]
  risk_scored_at:       string | null
  risk_scoring_method:  string | null
}

export interface DashboardResponse {
  user_role:      string
  project_scope:  string
  total_projects: number
  total_files:    number
  total_docs:     number
  total_chunks:   number
  projects:       DashboardProject[]
  indexed_at:     string
}

export const dashboardApi = {
  get: () => apiClient.get<DashboardResponse>('/dashboard'),
}