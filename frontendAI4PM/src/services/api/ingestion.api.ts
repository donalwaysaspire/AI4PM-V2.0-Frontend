import apiClient from '@/lib/apiClient'

export interface IngestFileResult {
  filename:          string
  project_name:      string
  artefact_type:     string
  confidence:        number
  needs_review:      boolean
  chunks_indexed:    number
  word_count:        number
  status:            'success' | 'failed'
  doc_project_found: boolean
  doc_project_name:  string | null
  doc_project_excerpt: string
}

export interface IngestFailure {
  filename: string
  error:    string
}

export interface IngestResponse {
  filename:      string
  project_name:  string
  status:        string
  total_files:   number
  ingested:      number
  failed:        number
  total_chunks:  number
  files:         IngestFileResult[]
  failures:      IngestFailure[]
}

export const ingestionApi = {
  ingest: (projectName: string, files: File[], onUploadProgress?: (pct: number) => void) => {
    const form = new FormData()
    files.forEach((f) => form.append('files', f))
    return apiClient.post<IngestResponse>('/ingest', form, {
      params: { project_name: projectName },
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300_000,
      onUploadProgress: (e) => {
        if (onUploadProgress && e.total) {
          onUploadProgress(Math.round((e.loaded * 100) / e.total))
        }
      },
    })
  },
}

export interface Artefact {
  filename:      string
  project_name:  string
  artefact_type: string
  word_count:    number
  ingested_at:   string
}

export interface ArtefactsResponse {
  artefacts: Artefact[]
  total:     number
}

export interface ProjectDocument {
  id:          string
  filename:    string
  file_type:   string
  file_size:   number
  chunk_count: number
  uploaded_at: string
  status:      string
}

export interface ProjectDocumentStats {
  doc_count:        number
  total_chunks:     number
  total_size_bytes: number
  by_type:          Record<string, number>
}

export interface ProjectDocumentsResponse {
  project_name: string
  total:        number
  stats:        ProjectDocumentStats
  documents:    ProjectDocument[]
}

export const documentsApi = {
  getAll: (projectName: string) =>
    apiClient.get<ProjectDocumentsResponse>(`/projects/${encodeURIComponent(projectName)}/documents`),

  delete: (projectName: string, docId: string) =>
    apiClient.delete<{ message: string }>(`/projects/${encodeURIComponent(projectName)}/documents/${encodeURIComponent(docId)}`),
}

export const artefactsApi = {
  getAll: (projectName?: string) =>
    apiClient.get<ArtefactsResponse>('/artefacts', {
      params: projectName ? { project_name: projectName } : undefined,
    }),
}