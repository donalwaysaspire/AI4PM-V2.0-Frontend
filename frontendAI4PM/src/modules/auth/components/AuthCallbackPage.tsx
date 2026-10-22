import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { ROUTES } from '@/constants'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { authApi } from '@/services/api/auth.api'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  useEffect(() => {
    let active = true
    clearAuth()

    authApi.me()
      .then(({ data }) => {
        if (!active) return
        setUser(data)
        navigate(ROUTES.DASHBOARD, { replace: true })
      })
      .catch(() => {
        if (!active) return
        navigate(ROUTES.LOGIN, { replace: true })
      })

    return () => {
      active = false
    }
  }, [clearAuth, navigate, setUser])

  return <LoadingSpinner fullPage />
}
