import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Gauge, RefreshCw, Loader2, AlertCircle, AlertTriangle,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react'
import { cn, getErrorMessage } from '@/utils'
import { kpiApi } from '@/services/api/kpi.api'
import ProjectSelect from './ProjectSelect'
import KpiInfoButton from './KpiInfoButton'

function trendConfig(trend: string) {
  switch (trend.toLowerCase()) {
    case 'increasing': return { icon: TrendingUp,   bg: 'bg-red-50',   text: 'text-red-600',   badge: 'bg-red-100 text-red-700'     }
    case 'decreasing': return { icon: TrendingDown, bg: 'bg-green-50', text: 'text-green-600', badge: 'bg-green-100 text-green-700' }
    default:           return { icon: Minus,        bg: 'bg-surface-50', text: 'text-surface-500', badge: 'bg-surface-100 text-surface-600' }
  }
}

export default function RiskAccelerationPage() {
  const [project, setProject] = useState('')
  const [window_, setWindow]  = useState(5)

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['risk-acceleration', project, window_],
    queryFn:  () => kpiApi.getRiskAcceleration(project, window_).then((r) => r.data),
    enabled:  !!project,
    staleTime: 0,
    retry: false,
  })

  const errorMsg = data ? '' : getErrorMessage(error) || 'Failed to load risk acceleration'

  return (
    <div className="page-container">
      <div>
        <h2 className="page-title">Risk Acceleration</h2>
        <p className="page-subtitle">How quickly a project's risk score is rising or falling</p>
      </div>

      <div className="card">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[220px]">
            <label className="label mb-1">Project</label>
            <ProjectSelect value={project} onChange={setProject} />
          </div>
          <div>
            <label className="label mb-1">Window</label>
            <select
              value={window_}
              onChange={(e) => setWindow(Number(e.target.value))}
              className="input w-24"
            >
              {[2, 3, 5, 10, 20].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          {project && (
            <button onClick={() => refetch()} disabled={isFetching} className="btn-outline px-3 h-[42px]">
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {!project && (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center mb-3">
            <Gauge size={22} className="text-primary-500" />
          </div>
          <p className="text-sm font-medium text-surface-600">Select a project to view its risk acceleration</p>
        </div>
      )}

      {project && (isLoading || isFetching) && (
        <div className="card flex items-center justify-center py-16 gap-2 text-surface-400 text-sm">
          <Loader2 size={18} className="animate-spin" /> Loading risk acceleration…
        </div>
      )}

      {project && isError && !isFetching && (
        <div className="card flex items-center gap-3 py-6 px-4 border-red-100 bg-red-50">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{errorMsg}</p>
        </div>
      )}

      {data && !isFetching && !isError && (
        <>
          {data.alert && (
            <div className="card flex items-center gap-3 py-3 px-4 border-amber-100 bg-amber-50">
              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-700">{data.alert}</p>
            </div>
          )}

          {/* KPI tile */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-base font-semibold text-surface-800">Risk Acceleration Rate</h3>
              <KpiInfoButton description={data.kpi_info.description} whyItMatters={data.kpi_info.why_it_matters} />
            </div>
            {(() => {
              const cfg = trendConfig(data.trend)
              const Icon = cfg.icon
              return (
                <div className="flex flex-col items-center gap-3">
                  <div className={cn('w-20 h-20 rounded-2xl flex items-center justify-center', cfg.bg)}>
                    <Icon size={32} className={cfg.text} />
                  </div>
                  <p className={cn('text-2xl font-bold', cfg.text)}>
                    {data.risk_acceleration_rate > 0 ? '+' : ''}{data.risk_acceleration_rate.toFixed(2)} / snapshot
                  </p>
                  <span className={cn('badge capitalize', cfg.badge)}>{data.trend}</span>
                </div>
              )
            })()}
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card flex flex-col items-center justify-center gap-1 py-6">
              <p className="text-3xl font-bold text-surface-800">{data.latest_risk_score}</p>
              <p className="text-xs text-surface-400">Latest Risk Score</p>
            </div>
            <div className="card flex flex-col items-center justify-center gap-1 py-6">
              <p className="text-3xl font-bold text-surface-800">{data.previous_risk_score}</p>
              <p className="text-xs text-surface-400">Previous Risk Score</p>
            </div>
            <div className="card flex flex-col items-center justify-center gap-1 py-6">
              <p className="text-3xl font-bold text-primary-600">{data.snapshot_count}</p>
              <p className="text-xs text-surface-400">Snapshots Used</p>
            </div>
          </div>

          {/* Scores used */}
          <div className="card">
            <h4 className="text-sm font-semibold text-surface-700 mb-3">Scores Used (oldest → newest)</h4>
            <div className="flex flex-wrap gap-2">
              {data.scores_used.map((s, i) => (
                <span key={i} className="badge badge-neutral text-sm font-medium">{s}</span>
              ))}
            </div>
          </div>

          <p className="text-xs text-surface-400 text-right">
            Computed at {new Date(data.computed_at).toLocaleString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </>
      )}
    </div>
  )
}
