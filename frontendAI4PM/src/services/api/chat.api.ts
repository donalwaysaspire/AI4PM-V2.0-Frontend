import apiClient from '@/lib/apiClient'

export interface ChatSource {
  filename:      string
  artefact_type: string
  project_name:  string
}

export interface ChatRequest {
  message:      string
  project_name: string
}

export interface ChatResponse {
  response:         string
  sources:          ChatSource[]
  recommendations:  string[]
  innovation_prompt: string | null
  context_used:     number
  project_name:     string
  generated_at:     string
  grounded:         boolean
}

export const chatApi = {
  send: (payload: ChatRequest) =>
    apiClient.post<ChatResponse>('/valugpt/chat', payload),

  clearHistory: () =>
    apiClient.delete<{ message: string }>('/valugpt/history'),
}