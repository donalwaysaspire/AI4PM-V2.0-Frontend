import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { authApi } from '@/services/api/auth.api'
import { ROUTES } from '@/constants'
import type { LoginCredentials } from '@/types'

export const useAuth = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, setToken, setUser, clearAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const login = async (credentials: LoginCredentials) => {
    setLoading(true)
    try {
      const { data: loginData } = await authApi.login(credentials)
      setToken(loginData.access_token)

      const { data: profile } = await authApi.me()
      setUser(profile)

      toast.success(`Welcome back, ${profile.username}!`)
      navigate(ROUTES.DASHBOARD)
    } catch (error) {
      clearAuth()
      throw error  // let LoginPage handle the error display — no toast here
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    clearAuth()
    navigate(ROUTES.LOGIN)
    toast.success('Logged out successfully')
  }

  return { user, isAuthenticated, loading, login, logout }
}