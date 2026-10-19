import apiClient from '@/lib/apiClient'

export interface Innovation {
  id:           string
  project_name: string
  title:        string
  description:  string
  category:     string
  tags:         string[]
  benefits:     string
  submitted_by: string
  submitted_at: string
}

export interface InnovationsListResponse {
  innovations: Innovation[]
  total:       number
}

export interface SubmitInnovationPayload {
  project_name: string
  title:        string
  description:  string
  category:     string
  tags:         string[]
  benefits:     string
}

export interface SubmitInnovationResponse {
  message: string
  id:      string
}

export const innovationsApi = {
  submit: (payload: SubmitInnovationPayload) =>
    apiClient.post<SubmitInnovationResponse>('/innovations', payload),

  getAll: (projectName: string) =>
    apiClient.get<InnovationsListResponse>('/innovations', {
      params: { project_name: projectName },
    }),
}