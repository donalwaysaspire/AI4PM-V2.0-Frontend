import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Upload, MessageSquare,
  AlertTriangle, Lightbulb, ChevronLeft, ChevronRight, GitBranch, Shield,
} from 'lucide-react'
import { ROUTES, APP_NAME } from '@/constants'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { cn } from '@/utils'

const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD,    label: 'Dashboard',         icon: LayoutDashboard, permission: 'dashboard:read'        },
  { to: ROUTES.USERS,        label: 'User Management',   icon: Users,           permission: 'users:manage'          },
  { to: ROUTES.INGESTION,    label: 'Ingestion',         icon: Upload,          permission: 'artefacts:ingest'      },
  { to: ROUTES.CHAT,         label: 'Chat',              icon: MessageSquare,   permission: 'valugpt:chat'          },
  { to: ROUTES.IMPACT,       label: 'Impact Analysis',   icon: GitBranch,       permission: 'impact_analysis:query' },
  { to: ROUTES.RISK,         label: 'Risk Heatmap',      icon: Shield,          permission: 'risk_heatmap:read'     },
  { to: ROUTES.ANOMALY,      label: 'Anomaly Detection', icon: AlertTriangle,   permission: 'anomaly:detect'        },
  { to: ROUTES.INNOVATIONS,  label: 'Innovations',       icon: Lightbulb,       permission: 'innovations:submit'    },
]

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const user = useAuthStore((s) => s.user)
  const hasPermission = useAuthStore((s) => s.hasPermission)

  const visibleItems = NAV_ITEMS.filter(({ permission }) => hasPermission(permission))

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-white border-r border-surface-100 z-40',
        'flex flex-col transition-all duration-300 shadow-card',
        sidebarCollapsed ? 'w-16' : 'w-[260px]'
      )}
    >
      {/* Brand */}
      <div className={cn(
        'flex items-center h-16 border-b border-surface-100 px-4 gap-3 flex-shrink-0',
        sidebarCollapsed && 'justify-center px-0'
      )}>
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">P</span>
        </div>
        {!sidebarCollapsed && (
          <span className="font-bold text-surface-900 text-base truncate">{APP_NAME}</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn('sidebar-link', isActive && 'active', sidebarCollapsed && 'justify-center px-0')
            }
            title={sidebarCollapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!sidebarCollapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      {!sidebarCollapsed && user && (
        <div className="p-3 border-t border-surface-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-surface-900 truncate">{user.username}</p>
              <p className="text-xs text-surface-400 truncate capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-surface-200',
          'flex items-center justify-center shadow-sm hover:bg-surface-50 transition-colors z-50'
        )}
      >
        {sidebarCollapsed
          ? <ChevronRight size={12} className="text-surface-500" />
          : <ChevronLeft  size={12} className="text-surface-500" />
        }
      </button>
    </aside>
  )
}
