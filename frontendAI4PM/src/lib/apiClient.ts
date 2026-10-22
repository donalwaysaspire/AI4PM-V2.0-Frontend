import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { STORAGE_KEYS, API_TIMEOUT } from '@/constants'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/',
  withCredentials: true,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const url = error.config?.url ?? ''
    const isLoginEndpoint = url.includes('auth/login') || url.includes('auth/token')

    // Only redirect to login on 401 if it's NOT the login endpoint itself
    if (error.response?.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default apiClient
