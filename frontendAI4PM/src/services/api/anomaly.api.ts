import apiClient from '@/lib/apiClient'

export interface Anomaly {
  row_number:     number
  identifiers:    Record<string, string | number>
  anomaly_score:  number
  anomaly_reason: string
}

export interface AnomalyResponse {
  total_rows:            number
  anomaly_count:         number
  feature_columns_used:  string[]
  anomalies:             Anomaly[]
}

export const anomalyApi = {
  detect: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post<AnomalyResponse>('/anomaly/detect', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}