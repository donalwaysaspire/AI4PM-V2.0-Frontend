import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { useAuthStore } from '@/modules/auth/store/authStore'
import AppLayout from '@/components/layout/AppLayout'
import LoadingSpinner from '@/components/common/LoadingSpinner'

// ─── Lazy Pages ───────────────────────────────────────────────────────────────
const LoginPage        = lazy(() => import('@/modules/auth/components/LoginPage'))
const AuthCallbackPage = lazy(() => import('@/modules/auth/components/AuthCallbackPage'))
const DashboardPage    = lazy(() => import('@/modules/dashboard/components/DashboardPage'))
const UsersPage        = lazy(() => import('@/modules/users/components/UsersPage'))
const CreateUserPage   = lazy(() => import('@/modules/users/components/CreateUserPage'))
const IngestionPage    = lazy(() => import('@/modules/ingestion/components/IngestionPage'))
const ChatPage         = lazy(() => import('@/modules/chat/components/ChatPage'))
const AnomalyPage      = lazy(() => import('@/modules/anomaly/components/AnomalyPage'))
const InnovationsPage  = lazy(() => import('@/modules/innovations/components/InnovationsPage'))
const ImpactPage       = lazy(() => import('@/modules/impact/components/ImpactPage'))
const RiskPage         = lazy(() => import('@/modules/risk/components/RiskPage'))

// ─── Guards ───────────────────────────────────────────────────────────────────
const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Outlet /> : <Navigate to={ROUTES.LOGIN} replace />
}

const PublicRoute = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} replace /> : <Outlet />
}

const PermissionGuard = ({ permission }: { permission: string }) => {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  return hasPermission(permission) ? <Outlet /> : <Navigate to={ROUTES.DASHBOARD} replace />
}

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingSpinner fullPage />}>{children}</Suspense>
)

// ─── Router ───────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      { path: ROUTES.LOGIN, element: <SuspenseWrapper><LoginPage /></SuspenseWrapper> },
      { path: ROUTES.AUTH_CALLBACK, element: <SuspenseWrapper><AuthCallbackPage /></SuspenseWrapper> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to={ROUTES.DASHBOARD} replace /> },
          { path: ROUTES.DASHBOARD, element: <SuspenseWrapper><DashboardPage /></SuspenseWrapper> },

          {
            element: <PermissionGuard permission="users:manage" />,
            children: [
              { path: ROUTES.USERS,        element: <SuspenseWrapper><UsersPage /></SuspenseWrapper> },
              { path: ROUTES.USERS_CREATE, element: <SuspenseWrapper><CreateUserPage /></SuspenseWrapper> },
              { path: ROUTES.USERS_EDIT,   element: <SuspenseWrapper><CreateUserPage /></SuspenseWrapper> },
            ],
          },
          {
            element: <PermissionGuard permission="artefacts:ingest" />,
            children: [
              { path: ROUTES.INGESTION, element: <SuspenseWrapper><IngestionPage /></SuspenseWrapper> },
            ],
          },
          {
            element: <PermissionGuard permission="valugpt:chat" />,
            children: [
              { path: ROUTES.CHAT, element: <SuspenseWrapper><ChatPage /></SuspenseWrapper> },
            ],
          },
          {
            element: <PermissionGuard permission="anomaly:detect" />,
            children: [
              { path: ROUTES.ANOMALY, element: <SuspenseWrapper><AnomalyPage /></SuspenseWrapper> },
            ],
          },
          {
            element: <PermissionGuard permission="innovations:submit" />,
            children: [
              { path: ROUTES.INNOVATIONS, element: <SuspenseWrapper><InnovationsPage /></SuspenseWrapper> },
            ],
          },
          {
            element: <PermissionGuard permission="impact_analysis:query" />,
            children: [
              { path: ROUTES.IMPACT, element: <SuspenseWrapper><ImpactPage /></SuspenseWrapper> },
            ],
          },
          {
            element: <PermissionGuard permission="risk_heatmap:read" />,
            children: [
              { path: ROUTES.RISK, element: <SuspenseWrapper><RiskPage /></SuspenseWrapper> },
            ],
          },

        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={ROUTES.DASHBOARD} replace /> },
])
