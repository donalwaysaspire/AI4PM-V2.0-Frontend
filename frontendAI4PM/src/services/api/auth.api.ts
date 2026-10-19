import apiClient from '@/lib/apiClient'
import type { LoginCredentials, LoginApiResponse, UserProfile } from '@/types'

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<LoginApiResponse>('/auth/login', credentials),

  me: () =>
    apiClient.get<UserProfile>('/auth/me'),

  logout: () =>
    apiClient.post('/auth/logout'),
}