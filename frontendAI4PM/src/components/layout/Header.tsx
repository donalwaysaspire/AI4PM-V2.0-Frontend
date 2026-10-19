import { Bell, LogOut, User } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { ROUTES } from '@/constants'

const PAGE_TITLES: Record<string, string> = {
  [ROUTES.DASHBOARD]:   'Dashboard',
  [ROUTES.USERS]:       'User Management',
  [ROUTES.INGESTION]:   'Data Ingestion',
  [ROUTES.CHAT]:        'Chat',
  [ROUTES.ANOMALY]:     'Anomaly Detection',
  [ROUTES.INNOVATIONS]: 'Innovations',
}

export default function Header() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const title = PAGE_TITLES[pathname] ?? 'ProjectHub'

  return (
    <header className="h-16 bg-white border-b border-surface-100 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-lg font-semibold text-surface-900">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-surface-100 transition-colors">
          <Bell size={18} className="text-surface-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
            {user ? user.username.slice(0, 2).toUpperCase() : <User size={14} />}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-surface-900 leading-none">{user?.username}</p>
            <p className="text-xs text-surface-400 mt-0.5 capitalize">{user?.role}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="p-2 rounded-xl hover:bg-surface-100 transition-colors text-surface-500 hover:text-danger-500"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}