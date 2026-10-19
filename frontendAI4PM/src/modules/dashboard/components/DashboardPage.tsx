import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Database, FileText, RefreshCw, Upload, MessageSquare,
  Lightbulb, GitBranch, FolderOpen, ChevronRight, Shield,
  CheckCircle2, XCircle, AlertTriangle, GitPullRequest,
  ChevronDown, Search, Check, Loader2, Gauge,
} from 'lucide-react'
import { dashboardApi } from '@/services/api/dashboard.api'
import type { DashboardProject } from '@/services/api/dashboard.api'
import { artefactsApi } from '@/services/api/ingestion.api'
import { kpiApi } from '@/services/api/kpi.api'
import { usersApi } from '@/services/api/users.api'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { ROUTES, ROLE_LABELS } from '@/constants'
import { cn } from '@/utils'
import KpiInfoButton from '@/modules/kpis/components/KpiInfoButton'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const TIER_CONFIG: Record<string, { bg: string; text: string; bar: string }> = {
  Critical: { bg: 'bg-red-50',    text: 'text-red-700',    bar: '#ef4444' },
  High:     { bg: 'bg-orange-50', text: 'text-orange-700', bar: '#f97316' },
  Medium:   { bg: 'bg-amber-50',  text: 'text-amber-700',  bar: '#f59e0b' },
  Low:      { bg: 'bg-green-50',  text: 'text-green-700',  bar: '#22c55e' },
}

function kpiTierBadge(tier: string) {
  const t = tier.toLowerCase()
  if (['strong', 'high', 'low_ambiguity', 'decreasing', 'full_alignment'].includes(t))               return 'bg-green-100 text-green-700'
  if (['moderate', 'moderate_ambiguity', 'stable', 'partial_misalignment'].includes(t))             return 'bg-amber-100 text-amber-700'
  if (['weak', 'low', 'high_ambiguity', 'increasing', 'significant_misalignment'].includes(t))      return 'bg-red-100   text-red-700'
  return 'bg-surface-100 text-surface-600'
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: any; color: string; sub?: string
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-surface-900">{value.toLocaleString()}</p>
        <p className="text-sm text-surface-500">{label}</p>
        {sub && <p className="text-xs text-surface-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Project Row ──────────────────────────────────────────────────────────────
function ProjectRow({ project }: { project: DashboardProject }) {
  const tier    = project.risk_tier
  const tierCfg = tier ? TIER_CONFIG[tier] : null
  const hasRisk = project.risk_score !== null && tier !== null

  return (
    <div className="p-4 rounded-xl border border-surface-100 hover:bg-surface-50 transition-colors space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
            <FolderOpen size={14} className="text-primary-500" />
          </div>
          <p className="font-semibold text-surface-900 capitalize">{project.project_name}</p>
        </div>
        <div className="flex items-center gap-2">
          {project.has_risk_data
            ? <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-md font-medium">
                <CheckCircle2 size={11} /> Risk data
              </span>
            : <span className="flex items-center gap-1 text-xs text-surface-400 bg-surface-100 px-2 py-0.5 rounded-md">
                <XCircle size={11} /> No risk data
              </span>
          }
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Files',  value: project.files_uploaded },
          { label: 'Docs',   value: project.docs_indexed   },
          { label: 'Chunks', value: project.chunks_indexed },
        ].map(({ label, value }) => (
          <div key={label} className="bg-surface-50 rounded-lg px-3 py-1.5 text-center">
            <p className="text-sm font-semibold text-surface-800">{value.toLocaleString()}</p>
            <p className="text-xs text-surface-400">{label}</p>
          </div>
        ))}
      </div>

      {hasRisk && tierCfg ? (
        <div className={cn('rounded-lg px-3 py-2.5 space-y-2', tierCfg.bg)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={13} className={tierCfg.text} />
              <span className={cn('text-xs font-semibold', tierCfg.text)}>Risk Score</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('text-sm font-bold', tierCfg.text)}>{project.risk_score}</span>
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full bg-white bg-opacity-60', tierCfg.text)}>
                {tier}
              </span>
            </div>
          </div>
          <div className="w-full bg-white bg-opacity-50 rounded-full h-1.5">
            <div className="h-1.5 rounded-full transition-all"
              style={{ width: `${project.risk_score}%`, backgroundColor: tierCfg.bar }} />
          </div>
          {project.risk_top_drivers.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.risk_top_drivers.slice(0, 3).map((d) => (
                <span key={d} className="text-xs bg-white bg-opacity-60 px-1.5 py-0.5 rounded text-surface-600">{d}</span>
              ))}
            </div>
          )}
          {project.risk_scored_at && (
            <p className="text-xs text-surface-400">Scored {formatDate(project.risk_scored_at)}</p>
          )}
        </div>
      ) : project.has_risk_data ? (
        <div className="rounded-lg px-3 py-2 bg-surface-50 border border-dashed border-surface-200">
          <p className="text-xs text-surface-400 flex items-center gap-1.5">
            <AlertTriangle size={11} /> Risk not yet scored — go to Risk Heatmap to compute
          </p>
        </div>
      ) : null}
    </div>
  )
}

// ─── Quick Action ─────────────────────────────────────────────────────────────
function QuickAction({ label, icon: Icon, to, color, permission }: {
  label: string; icon: any; to: string; color: string; permission: string
}) {
  const navigate      = useNavigate()
  const hasPermission = useAuthStore((s) => s.hasPermission)
  if (!hasPermission(permission)) return null
  return (
    <button onClick={() => navigate(to)}
      className="flex items-center justify-between p-3 rounded-xl border border-surface-100 hover:bg-surface-50 hover:border-surface-200 transition-all group">
      <div className="flex items-center gap-3">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color)}>
          <Icon size={15} />
        </div>
        <span className="text-sm font-medium text-surface-700">{label}</span>
      </div>
      <ChevronRight size={14} className="text-surface-300 group-hover:text-surface-500 transition-colors" />
    </button>
  )
}

// ─── KPI Project Select ───────────────────────────────────────────────────────
function KpiProjectSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn:  () => usersApi.getProjects().then((r) => r.data.projects),
  })
  const options  = (data ?? []).map((p) => p.project_name)
  const filtered = options.filter((p) => p.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="relative">
      <button type="button" onClick={() => { setOpen((o) => !o); setSearch('') }}
        className={cn('input flex items-center justify-between text-left w-full', !value && 'text-surface-400')}>
        <span className="truncate">{isLoading ? 'Loading…' : (value || 'Select a project…')}</span>
        <ChevronDown size={15} className={cn('flex-shrink-0 text-surface-400 transition-transform ml-2', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full bg-white border border-surface-200 rounded-xl shadow-card-md overflow-hidden">
            <div className="p-2 border-b border-surface-100">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400" />
                <input autoFocus type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full pl-7 pr-3 py-1.5 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                  onClick={(e) => e.stopPropagation()} />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0 && <p className="px-4 py-3 text-sm text-surface-400">No projects</p>}
              {filtered.map((p) => (
                <button key={p} type="button" onClick={() => { onChange(p); setOpen(false) }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-surface-50 transition-colors text-left">
                  <span className={value === p ? 'text-primary-700 font-medium' : 'text-surface-700'}>{p}</span>
                  {value === p && <Check size={14} className="text-primary-600" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── KPI Tile ─────────────────────────────────────────────────────────────────
function KpiTile({ title, description, whyItMatters, score, tier, sub, loading, error }: {
  title:         string
  description:   string
  whyItMatters:  string
  score:         string
  tier:          string
  sub?:          string
  loading:       boolean
  error:         boolean
}) {
  return (
    <div className="card flex flex-col gap-3 min-h-[140px]">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-surface-700 flex-1 leading-snug">{title}</p>
        {description && <KpiInfoButton description={description} whyItMatters={whyItMatters} />}
      </div>
      {loading
        ? <div className="flex-1 flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-surface-300" />
          </div>
        : error
        ? <div className="flex-1 flex items-center justify-center text-xs text-red-400">Failed to load</div>
        : (
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <p className="text-4xl font-bold text-surface-800">{score}</p>
            {tier && (
              <span className={cn('badge text-xs capitalize', kpiTierBadge(tier))}>
                {tier.replace(/_/g, ' ')}
              </span>
            )}
            {sub && <p className="text-xs text-surface-400">{sub}</p>}
          </div>
        )
      }
    </div>
  )
}

// ─── KPI Snapshot Section ─────────────────────────────────────────────────────
function KpiSection() {
  const [project, setProject] = useState('')

  const { data: kc, isLoading: lcKc, isError: errKc } = useQuery({
    queryKey: ['kpi-knowledge-coverage', project],
    queryFn:  () => kpiApi.getKnowledgeCoverage(project).then((r) => r.data),
    enabled:  !!project, staleTime: 60_000, retry: false,
  })
  const { data: ra, isLoading: lcRa, isError: errRa } = useQuery({
    queryKey: ['kpi-risk-acceleration', project],
    queryFn:  () => kpiApi.getRiskAcceleration(project).then((r) => r.data),
    enabled:  !!project, staleTime: 60_000, retry: false,
  })
  const { data: dc, isLoading: lcDc, isError: errDc } = useQuery({
    queryKey: ['kpi-delivery-confidence', project],
    queryFn:  () => kpiApi.getDeliveryConfidence(project).then((r) => r.data),
    enabled:  !!project, staleTime: 60_000, retry: false,
  })
  const { data: aq, isLoading: lcAq, isError: errAq } = useQuery({
    queryKey: ['kpi-requirement-ambiguity', project],
    queryFn:  () => kpiApi.getRequirementAmbiguity(project).then((r) => r.data),
    enabled:  !!project, staleTime: 60_000, retry: false,
  })
  const { data: sa, isLoading: lcSa, isError: errSa } = useQuery({
    queryKey: ['kpi-stakeholder-alignment', project],
    queryFn:  () => kpiApi.getStakeholderAlignment(project).then((r) => r.data),
    enabled:  !!project, staleTime: 60_000, retry: false,
  })

  const raRate  = ra?.risk_acceleration_rate ?? null
  const raScore = raRate != null
    ? (raRate > 0 ? `+${raRate.toFixed(2)}` : `${raRate.toFixed(2)}`)
    : '—'

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
            <Gauge size={18} className="text-primary-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-surface-800">Project KPI Snapshot</h3>
            <p className="text-xs text-surface-400">Select a project to view its key performance indicators</p>
          </div>
        </div>
      </div>

      <div className="mb-5 max-w-xs">
        <KpiProjectSelect value={project} onChange={setProject} />
      </div>

      {!project ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-10 h-10 rounded-2xl bg-surface-100 flex items-center justify-center mb-2">
            <Gauge size={18} className="text-surface-400" />
          </div>
          <p className="text-sm text-surface-400">Select a project above to load KPIs</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4">
          <KpiTile
            title="Knowledge Coverage"
            description={kc?.kpi_info?.description ?? ''}
            whyItMatters={kc?.kpi_info?.why_it_matters ?? ''}
            score={kc ? `${kc.knowledge_coverage_score}` : '—'}
            tier={kc?.tier ?? ''}
            loading={lcKc}
            error={errKc}
          />
          <KpiTile
            title="Risk Acceleration"
            description={ra?.kpi_info?.description ?? ''}
            whyItMatters={ra?.kpi_info?.why_it_matters ?? ''}
            score={raScore}
            tier={ra?.trend ?? ''}
            loading={lcRa}
            error={errRa}
          />
          <KpiTile
            title="Delivery Confidence"
            description={dc?.kpi_info?.description ?? ''}
            whyItMatters={dc?.kpi_info?.why_it_matters ?? ''}
            score={dc ? `${dc.delivery_confidence_score}` : '—'}
            tier={dc?.confidence_tier ?? ''}
            loading={lcDc}
            error={errDc}
          />
          <KpiTile
            title="Req. Ambiguity"
            description={aq?.kpi_info?.description ?? ''}
            whyItMatters={aq?.kpi_info?.why_it_matters ?? ''}
            score={aq ? `${aq.requirement_ambiguity_score}` : '—'}
            tier={aq?.tier ?? ''}
            loading={lcAq}
            error={errAq}
          />
          <KpiTile
            title="Stakeholder Alignment"
            description={sa?.kpi_info?.description ?? ''}
            whyItMatters={sa?.kpi_info?.why_it_matters ?? ''}
            score={sa ? `${sa.alignment_score}` : '—'}
            tier={sa?.tier ?? ''}
            sub={sa ? `${sa.conflicts.length} conflict${sa.conflicts.length !== 1 ? 's' : ''} detected` : undefined}
            loading={lcSa}
            error={errSa}
          />
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  () => dashboardApi.get().then((r) => r.data),
    staleTime: 60_000,
  })

  const { data: artefactsData } = useQuery({
    queryKey: ['artefacts-all'],
    queryFn:  () => artefactsApi.getAll().then((r) => r.data),
    staleTime: 60_000,
  })

  const crCount       = (artefactsData?.artefacts ?? []).filter((a) => a.artefact_type === 'Change Request (CR)').length
  const scoredCount   = (data?.projects ?? []).filter((p) => p.risk_score !== null).length
  const criticalCount = (data?.projects ?? []).filter((p) => p.risk_tier === 'Critical' || p.risk_tier === 'High').length

  return (
    <div className="page-container">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">
            Welcome back, <span className="font-medium text-surface-700">{user?.username}</span>
            {' · '}
            <span className="capitalize">{ROLE_LABELS[user?.role ?? ''] ?? user?.role}</span>
          </p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching} className="btn-outline">
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-surface-50" />)}
        </div>
      ) : isError ? (
        <div className="card text-center py-10 text-danger-500 text-sm">
          Failed to load dashboard. <button onClick={() => refetch()} className="underline">Retry</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard label="Total Projects"  value={data?.total_projects ?? 0} icon={FolderOpen}     color="bg-primary-50 text-primary-600" sub={`Scope: ${data?.project_scope}`} />
          <StatCard label="Files Uploaded"  value={data?.total_files    ?? 0} icon={Upload}         color="bg-blue-50   text-blue-600"   />
          <StatCard label="Docs Indexed"    value={data?.total_docs     ?? 0} icon={FileText}       color="bg-green-50  text-green-600"  />
          <StatCard label="Total Chunks"    value={data?.total_chunks   ?? 0} icon={Database}       color="bg-purple-50 text-purple-600" />
          <StatCard label="Change Requests" value={crCount}                   icon={GitPullRequest} color="bg-amber-50  text-amber-600"  />
        </div>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Projects — 2/3 width */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-surface-800">Project Overview</h3>
              {!isLoading && scoredCount > 0 && (
                <span className="text-xs text-surface-400">
                  {scoredCount}/{data?.total_projects} risk scored
                  {criticalCount > 0 && <span className="text-red-500 ml-1">· {criticalCount} need attention</span>}
                </span>
              )}
            </div>
            {data && <span className="text-xs text-surface-400">Indexed {formatDate(data.indexed_at)}</span>}
          </div>

          {isLoading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-surface-50 animate-pulse" />)}
            </div>
          )}

          {!isLoading && (!data?.projects || data.projects.length === 0) && (
            <div className="text-center py-10 text-surface-400 text-sm">No projects indexed yet</div>
          )}

          {!isLoading && data?.projects && data.projects.length > 0 && (
            <div className="space-y-3">
              {data.projects.map((p) => <ProjectRow key={p.project_name} project={p} />)}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Session info */}
          {data && (
            <div className="card">
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-3">Session Info</p>
              <div className="space-y-2">
                {[
                  { label: 'Role',          value: ROLE_LABELS[data.user_role] ?? data.user_role },
                  { label: 'Project scope', value: data.project_scope },
                  { label: 'Projects',      value: data.total_projects },
                  { label: 'Risk scored',   value: `${scoredCount} / ${data.total_projects}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-surface-500">{label}</span>
                    <span className="font-medium text-surface-800 capitalize">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="card">
            <h3 className="text-base font-semibold text-surface-800 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <QuickAction label="Upload Files"      icon={Upload}        to={ROUTES.INGESTION}   color="bg-green-50  text-green-600"  permission="artefacts:ingest"      />
              <QuickAction label="Chat with ValuGPT" icon={MessageSquare} to={ROUTES.CHAT}        color="bg-blue-50   text-blue-600"   permission="valugpt:chat"          />
              <QuickAction label="Impact Analysis"   icon={GitBranch}     to={ROUTES.IMPACT}      color="bg-amber-50  text-amber-600"  permission="impact_analysis:query" />
              <QuickAction label="Risk Heatmap"      icon={Shield}        to={ROUTES.RISK}        color="bg-red-50    text-red-600"    permission="risk_heatmap:read"     />
              <QuickAction label="Submit Innovation" icon={Lightbulb}     to={ROUTES.INNOVATIONS} color="bg-purple-50 text-purple-600" permission="innovations:submit"    />
            </div>
          </div>

        </div>
      </div>

      {/* KPI Snapshot */}
      <KpiSection />

    </div>
  )
}
