export const APP_NAME = 'Decision Intelligence'
export const APP_VERSION = '1.0.0'

export const ROUTES = {
  LOGIN:        '/login',
  AUTH_CALLBACK: '/auth/callback',
  DASHBOARD:    '/dashboard',
  USERS:        '/users',
  USERS_CREATE: '/users/create',
  USERS_EDIT:   '/users/:userId/edit',
  INGESTION:    '/ingestion',
  CHAT:         '/chat',
  ANOMALY:      '/anomaly',
  INNOVATIONS:  '/innovations',
  IMPACT:       '/impact',
  RISK:         '/risk',
  KPIS_KNOWLEDGE_COVERAGE:   '/kpis/knowledge-coverage',
  KPIS_RISK_ACCELERATION:    '/kpis/risk-acceleration',
  KPIS_DELIVERY_CONFIDENCE:  '/kpis/delivery-confidence',
  KPIS_REQUIREMENT_AMBIGUITY: '/kpis/requirement-ambiguity',
} as const

export const STORAGE_KEYS = {
  ACCESS_TOKEN:  'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER:          'user',
  THEME:         'theme',
} as const

export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xlsm'],
  'application/vnd.ms-excel.sheet.binary.macroEnabled.12': ['.xlsb'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'text/csv': ['.csv'],
  'text/plain': ['.txt'],
}
export const MAX_FILE_SIZE_MB = 50
export const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024

export const API_TIMEOUT = 60_000
export const LONG_TIMEOUT  = 120_000  // for compute-heavy endpoints (risk, anomaly)
export const RETRY_ATTEMPTS = 3

export const ROLE_LABELS: Record<string, string> = {
  viewer:                    'Viewer',
  project_owner:             'Project Owner',
  integrated_delivery_owner: 'Integrated Delivery Owner',
  business_unit_head:        'Business Unit Head',
  president:                 'President',
  admin:                     'Admin',
}

export const SEVERITY_COLORS: Record<string, string> = {
  low:      'badge-neutral',
  medium:   'badge-warning',
  high:     'badge-danger',
  critical: 'badge-danger',
}
