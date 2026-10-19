import apiClient from '@/lib/apiClient'
import type { User, Manager, Project } from '@/types'

export interface UsersListResponse {
  users: User[]
}

export interface ManagersListResponse {
  managers: Manager[]
  total: number
}

export interface ProjectsListResponse {
  projects: Project[]
  total: number
  scope: string
}

export interface CreateUserPayload {
  username: string
  email: string
  role: string
  password: string
  project_ids: string[]
  manager_ids: string[]
}

export interface UpdateUserPayload {
  role?:        string
  email?:       string
  password?:    string
  is_active?:   boolean
  project_ids?: string[]
  manager_ids?: string[]
}

export const usersApi = {
  getAll: () =>
    apiClient.get<UsersListResponse>('/users'),

  getById: (userId: string) =>
    apiClient.get<User>(`/users/${userId}`),

  create: (payload: CreateUserPayload) =>
    apiClient.post<User>('/users', payload),

  update: (userId: string, payload: UpdateUserPayload) =>
    apiClient.patch<User>(`/users/${userId}`, payload),

  delete: (userId: string) =>
    apiClient.delete(`/users/${userId}`),

  getManagers: (roleFilter: string) =>
    apiClient.get<ManagersListResponse>('/managers', {
      params: { role_filter: roleFilter },
    }),

  getProjects: () =>
    apiClient.get<ProjectsListResponse>('/projects'),

  deleteProject: (projectName: string) =>
    apiClient.delete(`/projects/${projectName}`),
}