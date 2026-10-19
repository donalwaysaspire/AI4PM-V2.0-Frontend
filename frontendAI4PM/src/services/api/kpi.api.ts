import apiClient from '@/lib/apiClient'

// ─── Shared ───────────────────────────────────────────────────────────────────
export interface KpiInfo {
  description:   string
  why_it_matters: string
}

// ─── Knowledge Coverage ───────────────────────────────────────────────────────
export interface KnowledgeCoverageResponse {
  project_name:             string
  knowledge_coverage_score: number
  tier:                     string
  present_artefacts:        string[]
  missing_artefacts:        string[]
  extra_artefacts:          string[]
  computed_at:              string
  kpi_info:                 KpiInfo
  alert?:                   string
}

// ─── Risk Acceleration ────────────────────────────────────────────────────────
export interface RiskAccelerationResponse {
  project_name:           string
  risk_acceleration_rate: number
  trend:                  string
  latest_risk_score:      number
  previous_risk_score:    number
  snapshot_count:         number
  scores_used:            number[]
  computed_at:            string
  kpi_info:               KpiInfo
  alert?:                 string
}

// ─── Delivery Confidence ──────────────────────────────────────────────────────
export interface DeliveryConfidenceResponse {
  project_name:               string
  delivery_confidence_score:  number
  confidence_tier:            string
  based_on_risk_score:        number
  based_on_risk_tier:         string
  scoring_method:             string
  top_risk_drivers:           string[]
  scored_at:                  string
  computed_at:                string
  kpi_info:                   KpiInfo
  alert?:                     string
}

// ─── Requirement Ambiguity ────────────────────────────────────────────────────
export interface RequirementAmbiguityResponse {
  project_name:              string
  files_analysed:            string[]
  requirement_ambiguity_score: number
  tier:                       string
  vague_passages:             string[]
  conflicting_passages:       string[]
  computed_at:                string
  kpi_info:                   KpiInfo
  alert?:                     string
}

// ─── Stakeholder Alignment ────────────────────────────────────────────────────
export interface AlignmentConflict {
  topic:       string
  source_a:    string
  statement_a: string
  source_b:    string
  statement_b: string
  severity:    'high' | 'medium' | 'low'
}

export interface StakeholderAlignmentResponse {
  project_name:          string
  alignment_score:       number
  tier:                  string
  conflicts:             AlignmentConflict[]
  aligned_topics:        string[]
  documents_compared:    number
  context_used:          number
  chat_history_excluded: boolean
  generated_at:          string
  grounded:              boolean
  parse_error:           string | null
  kpi_info:              KpiInfo
  alert?:                string
}

export const kpiApi = {
  getKnowledgeCoverage: (projectName: string) =>
    apiClient.get<KnowledgeCoverageResponse>(`/projects/${encodeURIComponent(projectName)}/knowledge-coverage`),

  getRiskAcceleration: (projectName: string, window = 5) =>
    apiClient.get<RiskAccelerationResponse>('/risk/acceleration', {
      params: { project_name: projectName, window },
    }),

  getDeliveryConfidence: (projectName: string) =>
    apiClient.get<DeliveryConfidenceResponse>('/kpis/delivery-confidence', {
      params: { project_name: projectName },
    }),

  getRequirementAmbiguity: (projectName: string) =>
    apiClient.get<RequirementAmbiguityResponse>('/kpis/requirement-ambiguity', {
      params: { project_name: projectName },
    }),

  getStakeholderAlignment: (projectName: string, artefactType?: string) =>
    apiClient.get<StakeholderAlignmentResponse>('/kpis/stakeholder-alignment', {
      params: { project_name: projectName, ...(artefactType ? { artefact_type: artefactType } : {}) },
    }),
}
