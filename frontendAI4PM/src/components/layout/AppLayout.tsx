import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { authApi } from '@/services/api/auth.api'
import { cn } from '@/utils'

export default function AppLayout() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const setUser          = useAuthStore((s) => s.setUser)
  const [validating, setValidating] = useState(true)

  useEffect(() => {
    authApi.me()
      .then((r) => {
        setUser(r.data)   // refresh user profile in case permissions changed
        setValidating(false)
      })
      .catch((err) => {
        // 401 → the apiClient interceptor already clears localStorage and
        // redirects to /login, so we stay in the loading state until that fires.
        // For any other error (network down, 5xx) let the user through — their
        // token is likely still valid; individual pages will surface errors.
        if (err?.response?.status !== 401) setValidating(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (validating) return <LoadingSpinner fullPage />

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      <Sidebar />
      <div
        className={cn(
          'flex flex-col flex-1 min-w-0 transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-[260px]'
        )}
      >
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
