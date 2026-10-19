import apiClient from '@/lib/apiClient'
import { LONG_TIMEOUT } from '@/constants'

// ─── Heatmap ──────────────────────────────────────────────────────────────────
export interface MetricBreakdown {
  metric:        string
  value:         number
  points:        number
  pct_of_score:  number
}

export interface RiskRow {
  Project:         string
  risk_score:      number
  risk_tier:       string
  top_drivers:     string[]
  metric_breakdown: MetricBreakdown[]
}

export interface RiskHeatmapResponse {
  project_name:      string
  overall_risk_score: number
  overall_risk_tier:  string
  top_drivers:        string[]
  total_rows:         number
  rows:               RiskRow[]
  scored_at:          string
  scoring_method:     string
  xgb_confidence:     number
  recommendations:    string[]
  ai_summary:         string
}

// ─── Feedback ─────────────────────────────────────────────────────────────────
export interface RiskFeedbackPayload {
  project_name:    string
  risk_score:      number
  actual_outcome:  string
  comment:         string
}

export interface RiskFeedbackResponse {
  message: string
}

// ─── Portfolio ────────────────────────────────────────────────────────────────
export interface PortfolioProject {
  project_name:       string
  overall_risk_score: number
  overall_risk_tier:  string
  scoring_method:     string
  total_rows:         number
  rows:               RiskRow[]
}

export interface RiskPortfolioResponse {
  projects:   PortfolioProject[]
  total:      number
  skipped:    string[]
  scored_at:  string
}

// ─── History ──────────────────────────────────────────────────────────────────
export interface RiskHistorySnapshot {
  project_name:       string
  overall_risk_score: number
  overall_risk_tier:  string
  top_drivers:        string[]
  total_rows:         number
  scoring_method:     string
  ai_summary:         string
  scored_at:          string
  scored_by:          string
}

export interface RiskHistoryResponse {
  project_name: string
  total:        number
  snapshots:    RiskHistorySnapshot[]
}

export const riskApi = {
  getScore: (projectName: string) =>
    apiClient.get<RiskHeatmapResponse>('/risk/score', {
      params:  { project_name: projectName },
      timeout: LONG_TIMEOUT,
    }),

  submitFeedback: (payload: RiskFeedbackPayload) =>
    apiClient.post<RiskFeedbackResponse>('/risk/feedback', payload),

  getPortfolio: (projectNames: string[]) =>
    apiClient.get<RiskPortfolioResponse>('/risk/portfolio', {
      params:  { project_names: projectNames.join(',') },
      timeout: LONG_TIMEOUT,
    }),

  getHistory: (projectName: string, limit = 10) =>
    apiClient.get<RiskHistoryResponse>('/risk/history', {
      params: { project_name: projectName, limit },
    }),
}