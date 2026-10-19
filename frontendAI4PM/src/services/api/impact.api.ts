import apiClient from '@/lib/apiClient'

export interface ImpactSource {
  filename:      string
  artefact_type: string
  project_name:  string
  relevance:     number
}

export interface ImpactRequest {
  query:         string
  project_name:  string
  artefact_type?: string
}

export interface ImpactResponse {
  answer:           string
  sources:          ImpactSource[]
  recommendations:  string[]
  innovation_prompt: string | null
  context_used:     number
  project_name:     string
  query:            string
  generated_at:     string
}

export const impactApi = {
  analyse: (payload: ImpactRequest) =>
    apiClient.post<ImpactResponse>('/impact', payload),
}