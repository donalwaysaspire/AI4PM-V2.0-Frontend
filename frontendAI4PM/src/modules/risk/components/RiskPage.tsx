import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import {
  Shield, AlertTriangle, TrendingUp, TrendingDown, Minus, ChevronDown, Search,
  Check, RefreshCw, Loader2, MessageSquare, BarChart3,
  AlertCircle, CheckCircle2, Lightbulb, Info, X,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import { cn, getErrorMessage } from '@/utils'
import { usersApi } from '@/services/api/users.api'
import { riskApi } from '@/services/api/risk.api'
import { useAuthStore } from '@/modules/auth/store/authStore'
import type { RiskHeatmapResponse, RiskRow, PortfolioProject, RiskHistorySnapshot } from '@/services/api/risk.api'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// ─── Constants ────────────────────────────────────────────────────────────────
const TIER_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; badge: string }> = {
  Critical: { label: 'Critical', bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    badge: 'bg-red-100    text-red-700'    },
  High:     { label: 'High',     bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
  Medium:   { label: 'Medium',   bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  badge: 'bg-amber-100  text-amber-700'  },
  Low:      { label: 'Low',      bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  badge: 'bg-green-100  text-green-700'  },
}

const TIER_ORDER = ['Critical', 'High', 'Medium', 'Low']

function tierConfig(tier: string) {
  return TIER_CONFIG[tier] ?? TIER_CONFIG.Low
}

// ─── AI Summary ───────────────────────────────────────────────────────────────
function AiSummary({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-sm max-w-none text-surface-700">
      <ReactMarkdown
        components={{
          p:      ({ children }) => <p className="mb-2 text-sm leading-relaxed">{children}</p>,
          h1:     ({ children }) => <p className="font-bold text-base mt-4 mb-1">{children}</p>,
          h2:     ({ children }) => <p className="font-bold text-sm mt-3 mb-1">{children}</p>,
          h3:     ({ children }) => <p className="font-bold text-sm mt-3 mb-1">{children}</p>,
          ul:     ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1 text-sm">{children}</ul>,
          ol:     ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1 text-sm">{children}</ol>,
          li:     ({ children }) => <li className="text-sm leading-relaxed pl-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}

// ─── Project Dropdown ─────────────────────────────────────────────────────────
function ProjectSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn:  () => usersApi.getProjects().then((r) => r.data.projects),
  })
  const options  = (projectsData ?? []).map((p) => p.project_name)
  const filtered = options.filter((p) => p.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="relative">
      <button type="button" onClick={() => { setOpen((p) => !p); setSearch('') }}
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

// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, tier }: { score: number; tier: string }) {
  const cfg  = tierConfig(tier)
  const r    = 40
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none"
          stroke={tier === 'Critical' ? '#ef4444' : tier === 'High' ? '#f97316' : tier === 'Medium' ? '#f59e0b' : '#22c55e'}
          strokeWidth="8" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="text-center">
        <p className={cn('text-2xl font-bold', cfg.text)}>{score}</p>
        <p className="text-xs text-surface-400">/ 100</p>
      </div>
    </div>
  )
}

// ─── Heatmap row table ────────────────────────────────────────────────────────
function HeatmapTable({ rows }: { rows: RiskRow[] }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [tierFilter, setTierFilter]   = useState('')

  const filtered = tierFilter ? rows.filter((r) => r.risk_tier === tierFilter) : rows

  return (
    <div>
      {/* Tier filter pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {(['', ...TIER_ORDER] as string[]).map((t) => (
          <button key={t || 'all'} onClick={() => setTierFilter(t)}
            className={cn('px-3 py-1 rounded-lg text-xs font-medium border transition-all',
              tierFilter === t
                ? t ? cn(tierConfig(t).badge, tierConfig(t).border, 'border') : 'bg-primary-600 text-white border-primary-600'
                : 'border-surface-200 text-surface-500 hover:border-surface-300'
            )}>
            {t || 'All'}
          </button>
        ))}
        <span className="ml-auto text-xs text-surface-400 self-center">{filtered.length} rows</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-100">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Project</th>
              <th>Risk Score</th>
              <th>Tier</th>
              <th>Top Drivers</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => {
              const cfg = tierConfig(row.risk_tier)
              const isExpanded = expandedIdx === i
              return (
                <>
                  <tr key={i} className={cn('cursor-pointer', cfg.bg)} onClick={() => setExpandedIdx(isExpanded ? null : i)}>
                    <td className="font-medium">{row.Project}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-surface-200 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full transition-all"
                            style={{
                              width: `${row.risk_score}%`,
                              background: row.risk_tier === 'Critical' ? '#ef4444' : row.risk_tier === 'High' ? '#f97316' : row.risk_tier === 'Medium' ? '#f59e0b' : '#22c55e'
                            }} />
                        </div>
                        <span className="text-sm font-semibold">{row.risk_score}</span>
                      </div>
                    </td>
                    <td><span className={cn('badge text-xs', cfg.badge)}>{row.risk_tier}</span></td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {row.top_drivers.slice(0, 3).map((d) => (
                          <span key={d} className="text-xs bg-surface-100 text-surface-600 px-1.5 py-0.5 rounded">{d}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <ChevronDown size={14} className={cn('text-surface-400 transition-transform', isExpanded && 'rotate-180')} />
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${i}-detail`} className="bg-white">
                      <td colSpan={5} className="p-0">
                        <div className="px-4 py-3 border-t border-surface-100">
                          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Metric Breakdown</p>
                          <div className="space-y-1.5">
                            {row.metric_breakdown.map((m) => (
                              <div key={m.metric} className="flex items-center gap-3">
                                <span className="text-xs text-surface-600 w-40 truncate">{m.metric}</span>
                                <div className="flex-1 bg-surface-100 rounded-full h-1.5">
                                  <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${Math.min(m.pct_of_score, 100)}%` }} />
                                </div>
                                <span className="text-xs text-surface-500 w-12 text-right">{m.pct_of_score.toFixed(1)}%</span>
                                <span className="text-xs text-surface-400 w-16 text-right">val: {m.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Heatmap Tab ──────────────────────────────────────────────────────────────
function HeatmapTab() {
  const [project, setProject] = useState('')

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['risk-score', project],
    queryFn:  () => riskApi.getScore(project).then((r) => r.data),
    enabled:  !!project,
    staleTime: 0,
    retry: false,
  })

  const errorMsg = (error as any)?.response?.data?.detail ?? 'Failed to load risk data'

  // Tier distribution
  const tierCounts = TIER_ORDER.reduce((acc, t) => {
    acc[t] = (data?.rows ?? []).filter((r) => r.risk_tier === t).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-5">
      {/* Project selector */}
      <div className="card">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="label mb-1">Project</label>
            <ProjectSelect value={project} onChange={(p) => { setProject(p) }} />
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
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-3">
            <Shield size={22} className="text-amber-500" />
          </div>
          <p className="text-sm font-medium text-surface-600">Select a project to view its risk heatmap</p>
        </div>
      )}

      {project && (isLoading || isFetching) && (
        <div className="card flex items-center justify-center py-16 gap-2 text-surface-400 text-sm">
          <Loader2 size={18} className="animate-spin" /> Computing risk scores…
        </div>
      )}

      {project && isError && !isFetching && (
        <div className="card flex items-center gap-3 py-6 px-4 border-red-100 bg-red-50">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{errorMsg}</p>
        </div>
      )}

      {data && !isFetching && (
        <>
          {/* Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Score ring */}
            <div className="card flex flex-col items-center justify-center gap-2 py-6">
              <ScoreRing score={data.overall_risk_score} tier={data.overall_risk_tier} />
              <div className="text-center">
                <p className="font-semibold text-surface-800">{data.project_name}</p>
                <span className={cn('badge text-xs mt-1', tierConfig(data.overall_risk_tier).badge)}>
                  {data.overall_risk_tier} Risk
                </span>
              </div>
              <p className="text-xs text-surface-400">{data.total_rows} rows · {(data.xgb_confidence * 100).toFixed(1)}% confidence</p>
            </div>

            {/* Tier distribution */}
            <div className="card">
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-3">Tier Distribution</p>
              <div className="space-y-2">
                {TIER_ORDER.map((t) => {
                  const count = tierCounts[t] ?? 0
                  const pct   = data.total_rows > 0 ? (count / data.total_rows) * 100 : 0
                  const cfg   = tierConfig(t)
                  return (
                    <div key={t} className="flex items-center gap-2">
                      <span className={cn('badge text-xs w-16 justify-center', cfg.badge)}>{t}</span>
                      <div className="flex-1 bg-surface-100 rounded-full h-2">
                        <div className="h-2 rounded-full transition-all"
                          style={{ width: `${pct}%`, background: t === 'Critical' ? '#ef4444' : t === 'High' ? '#f97316' : t === 'Medium' ? '#f59e0b' : '#22c55e' }} />
                      </div>
                      <span className="text-xs text-surface-500 w-6 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top drivers */}
            <div className="card">
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-3">Top Risk Drivers</p>
              <div className="space-y-1.5">
                {data.top_drivers.map((d, i) => (
                  <div key={d} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-primary-50 text-primary-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="text-sm text-surface-700">{d}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-surface-400 mt-3">Method: {data.scoring_method}</p>
            </div>
          </div>

          {/* AI Summary */}
          {data.ai_summary && (
            <div className="card">
              <h3 className="text-base font-semibold text-surface-800 mb-3 flex items-center gap-2">
                <Info size={16} className="text-primary-500" /> AI Risk Summary
              </h3>
              <AiSummary markdown={data.ai_summary} />
            </div>
          )}

          {/* Row heatmap table */}
          <div className="card">
            <h3 className="text-base font-semibold text-surface-800 mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-primary-500" /> Row-level Risk Heatmap
            </h3>
            <HeatmapTable rows={data.rows} />
          </div>
        </>
      )}
    </div>
  )
}

// ─── Feedback Tab ─────────────────────────────────────────────────────────────
const ACTUAL_OUTCOMES = [
  { value: 'at_risk',    label: 'At Risk'    },
  { value: 'on_track',   label: 'On Track'   },
  { value: 'delayed',    label: 'Delayed'    },
  { value: 'completed',  label: 'Completed'  },
  { value: 'cancelled',  label: 'Cancelled'  },
]

const feedbackSchema = z.object({
  project_name:   z.string().min(1, 'Please select a project'),
  risk_score:     z.number({ invalid_type_error: 'Enter a score 0–100' }).min(0).max(100),
  actual_outcome: z.string().min(1, 'Please select an outcome'),
  comment:        z.string(),
})
type FeedbackForm = z.infer<typeof feedbackSchema>

function FeedbackTab() {
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FeedbackForm>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { project_name: '', risk_score: undefined, actual_outcome: '', comment: '' },
  })

  const projectName   = watch('project_name')
  const actualOutcome = watch('actual_outcome')

  const { mutate: submit, isPending } = useMutation({
    mutationFn: riskApi.submitFeedback,
    onSuccess:  (res) => { toast.success(res.data.message); reset() },
    onError:    (e) => toast.error(getErrorMessage(e)),
  })

  const onInvalid = (errs: typeof errors) => {
    const first = Object.values(errs)[0]?.message
    if (first) toast.error(String(first))
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="card">
        <h3 className="text-base font-semibold text-surface-800 mb-4 flex items-center gap-2">
          <MessageSquare size={16} className="text-primary-500" /> Submit Risk Feedback
        </h3>
        <p className="text-xs text-surface-400 mb-5">Help improve the risk model by sharing actual outcomes for your project.</p>

        <form onSubmit={handleSubmit((v) => submit(v), onInvalid)} noValidate className="space-y-4">

          <div>
            <label className="label">Project <span className="text-danger-500">*</span></label>
            <ProjectSelect value={projectName} onChange={(v) => setValue('project_name', v, { shouldValidate: true })} />
            {errors.project_name && <p className="error-text">{errors.project_name.message}</p>}
          </div>

          <div>
            <label className="label">Risk Score <span className="text-danger-500">*</span>
              <span className="text-surface-400 font-normal ml-1">(0–100, the score you're giving feedback on)</span>
            </label>
            <input
              type="number" min={0} max={100}
              {...register('risk_score', { valueAsNumber: true })}
              placeholder="e.g. 75"
              className={cn('input', errors.risk_score && 'input-error')}
            />
            {errors.risk_score && <p className="error-text">{errors.risk_score.message}</p>}
          </div>

          <div>
            <label className="label">Actual Outcome <span className="text-danger-500">*</span></label>
            <div className="flex flex-wrap gap-2 mt-1">
              {ACTUAL_OUTCOMES.map(({ value, label }) => (
                <button key={value} type="button"
                  onClick={() => setValue('actual_outcome', value, { shouldValidate: true })}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-sm font-medium border transition-all',
                    actualOutcome === value
                      ? 'border-primary-400 bg-primary-50 text-primary-700'
                      : 'border-surface-200 text-surface-500 hover:border-surface-300'
                  )}>
                  {label}
                </button>
              ))}
            </div>
            {errors.actual_outcome && <p className="error-text">{errors.actual_outcome.message}</p>}
          </div>

          <div>
            <label className="label">Comment <span className="text-surface-400 font-normal">(optional)</span></label>
            <textarea {...register('comment')} rows={4}
              placeholder="Any additional context about the actual project outcome…"
              className="input resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => reset()} className="btn-outline">Reset</button>
            <button type="submit" disabled={isPending} className="btn-primary px-6">
              {isPending ? <><Loader2 size={15} className="animate-spin" /> Submitting…</> : <><MessageSquare size={15} /> Submit Feedback</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

// ─── Portfolio Tab ────────────────────────────────────────────────────────────
function PortfolioTab() {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn:  () => usersApi.getProjects().then((r) => r.data.projects),
  })
  const allProjectOptions = (projectsData ?? []).map((p) => p.project_name)
  const filteredOptions   = allProjectOptions.filter((p) => p.toLowerCase().includes(search.toLowerCase()))

  const toggleProject = (name: string) =>
    setSelectedProjects((prev) => prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name])

  const { data, isLoading, isError, refetch, isFetching, error } = useQuery({
    queryKey: ['risk-portfolio', selectedProjects],
    queryFn:  () => riskApi.getPortfolio(selectedProjects).then((r) => r.data),
    enabled:  selectedProjects.length > 0,
    staleTime: 0,
    retry: false,
  })

  const projects = data?.projects ?? []
  const sorted   = [...projects].sort((a, b) => b.overall_risk_score - a.overall_risk_score)

  const tierCounts = TIER_ORDER.reduce((acc, t) => {
    acc[t] = projects.filter((p) => p.overall_risk_tier === t).length
    return acc
  }, {} as Record<string, number>)

  const errorMsg = (error as any)?.response?.data?.detail ?? 'Failed to load portfolio'

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-5">

      {/* Project multi-selector */}
      <div className="card">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="label mb-1">Select Projects <span className="text-danger-500">*</span></label>
            <div className="relative">
              <button type="button" onClick={() => { setOpen((p) => !p); setSearch('') }}
                className={cn('input flex items-center justify-between text-left w-full', !selectedProjects.length && 'text-surface-400')}>
                <span className="truncate">
                  {selectedProjects.length ? `${selectedProjects.length} project${selectedProjects.length !== 1 ? 's' : ''} selected` : 'Select projects to compare…'}
                </span>
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
                      {filteredOptions.length === 0 && <p className="px-4 py-3 text-sm text-surface-400">No projects found</p>}
                      {filteredOptions.map((p) => (
                        <button key={p} type="button" onClick={() => toggleProject(p)}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-surface-50 transition-colors text-left">
                          <span className={selectedProjects.includes(p) ? 'text-primary-700 font-medium' : 'text-surface-700'}>{p}</span>
                          {selectedProjects.includes(p) && <Check size={14} className="text-primary-600" />}
                        </button>
                      ))}
                    </div>
                    {selectedProjects.length > 0 && (
                      <div className="px-4 py-2 border-t border-surface-100 flex justify-between items-center">
                        <span className="text-xs text-surface-400">{selectedProjects.length} selected</span>
                        <button type="button" onClick={() => setSelectedProjects([])} className="text-xs text-danger-500 hover:underline">Clear all</button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Chips */}
            {selectedProjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedProjects.map((p) => (
                  <span key={p} className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-lg font-medium">
                    {p}
                    <button type="button" onClick={() => toggleProject(p)} className="hover:text-primary-900 ml-0.5">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {selectedProjects.length > 0 && (
            <button onClick={() => refetch()} disabled={isFetching} className="btn-outline px-3 h-[42px]">
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {selectedProjects.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center mb-3">
            <BarChart3 size={22} className="text-primary-500" />
          </div>
          <p className="text-sm font-medium text-surface-600">Select one or more projects to view the portfolio risk</p>
          <p className="text-xs text-surface-400 mt-1">Projects are passed as comma-separated values to the API</p>
        </div>
      )}

      {selectedProjects.length > 0 && (isLoading || isFetching) && (
        <div className="card flex items-center justify-center py-16 gap-2 text-surface-400 text-sm">
          <Loader2 size={18} className="animate-spin" /> Computing portfolio risk…
        </div>
      )}

      {selectedProjects.length > 0 && isError && !isFetching && (
        <div className="card flex items-center gap-3 py-6 px-4 border-red-100 bg-red-50">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{errorMsg}</p>
        </div>
      )}

      {data && !isFetching && (
        <>
          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-surface-400">
            <span>{data.total} project{data.total !== 1 ? 's' : ''} scored</span>
            {data.scored_at && <span>Scored {formatDate(data.scored_at)}</span>}
          </div>

          {data.skipped.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
              <AlertCircle size={13} className="flex-shrink-0" />
              Skipped (no data): <strong>{data.skipped.join(', ')}</strong>
            </div>
          )}

          {/* Tier summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TIER_ORDER.map((t) => {
              const cfg   = tierConfig(t)
              const count = tierCounts[t] ?? 0
              return (
                <div key={t} className={cn('card text-center py-4 border', cfg.border, cfg.bg)}>
                  <p className={cn('text-2xl font-bold', cfg.text)}>{count}</p>
                  <p className={cn('text-xs font-medium mt-0.5', cfg.text)}>{t}</p>
                </div>
              )
            })}
          </div>

          {/* Project cards */}
          {sorted.length === 0 ? (
            <div className="card text-center py-12 text-surface-400 text-sm">No risk data available</div>
          ) : (
            <div className="space-y-4">
              {sorted.map((p) => {
                const cfg = tierConfig(p.overall_risk_tier)
                const tierDist = TIER_ORDER.reduce((acc, t) => {
                  acc[t] = p.rows.filter((r) => r.risk_tier === t).length
                  return acc
                }, {} as Record<string, number>)

                return (
                  <div key={p.project_name} className={cn('card border', cfg.border)}>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <ScoreRing score={p.overall_risk_score} tier={p.overall_risk_tier} />
                        <div>
                          <p className="font-semibold text-surface-900 capitalize text-lg">{p.project_name}</p>
                          <span className={cn('badge text-xs', cfg.badge)}>{p.overall_risk_tier} Risk</span>
                          <p className="text-xs text-surface-400 mt-1">{p.total_rows} rows · {p.scoring_method}</p>
                        </div>
                      </div>

                      {/* Tier distribution */}
                      <div className="hidden sm:block space-y-1.5 min-w-[180px]">
                        {TIER_ORDER.map((t) => {
                          const count = tierDist[t] ?? 0
                          const pct   = p.total_rows > 0 ? (count / p.total_rows) * 100 : 0
                          return (
                            <div key={t} className="flex items-center gap-2">
                              <span className={cn('text-xs w-14 text-right', tierConfig(t).text)}>{t}</span>
                              <div className="flex-1 bg-surface-100 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full"
                                  style={{ width: `${pct}%`, background: t === 'Critical' ? '#ef4444' : t === 'High' ? '#f97316' : t === 'Medium' ? '#f59e0b' : '#22c55e' }} />
                              </div>
                              <span className="text-xs text-surface-400 w-5 text-right">{count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Collapsed row table */}
                    <HeatmapTable rows={p.rows} />
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Trend Tab ────────────────────────────────────────────────────────────────
const TIER_COLOR: Record<string, string> = {
  Critical: '#ef4444',
  High:     '#f97316',
  Medium:   '#f59e0b',
  Low:      '#22c55e',
}

function TrendTab() {
  const [project, setProject] = useState('')
  const [limit, setLimit]     = useState(10)

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['risk-history', project, limit],
    queryFn:  () => riskApi.getHistory(project, limit).then((r) => r.data),
    enabled:  !!project,
    staleTime: 0,
    retry: false,
  })

  const errorMsg = (error as any)?.response?.data?.detail ?? 'Failed to load risk history'

  const chartData = [...(data?.snapshots ?? [])]
    .sort((a, b) => new Date(a.scored_at).getTime() - new Date(b.scored_at).getTime())
    .map((s) => ({
      date:    new Date(s.scored_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      score:   s.overall_risk_score,
      tier:    s.overall_risk_tier,
      drivers: s.top_drivers.join(', '),
    }))

  const trend = chartData.length >= 2
    ? chartData[chartData.length - 1].score - chartData[0].score
    : 0

  const latestSnapshot = data?.snapshots?.slice().sort(
    (a, b) => new Date(b.scored_at).getTime() - new Date(a.scored_at).getTime()
  )[0]

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="card">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="label mb-1">Project</label>
            <ProjectSelect value={project} onChange={setProject} />
          </div>
          <div>
            <label className="label mb-1">Snapshots</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="input w-24"
            >
              {[5, 10, 20, 50].map((v) => (
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
            <TrendingUp size={22} className="text-primary-500" />
          </div>
          <p className="text-sm font-medium text-surface-600">Select a project to view its risk score trend</p>
        </div>
      )}

      {project && (isLoading || isFetching) && (
        <div className="card flex items-center justify-center py-16 gap-2 text-surface-400 text-sm">
          <Loader2 size={18} className="animate-spin" /> Loading risk history…
        </div>
      )}

      {project && isError && !isFetching && (
        <div className="card flex items-center gap-3 py-6 px-4 border-red-100 bg-red-50">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{errorMsg}</p>
        </div>
      )}

      {data && !isFetching && chartData.length === 0 && (
        <div className="card text-center py-12 text-surface-400 text-sm">
          No history snapshots found for this project
        </div>
      )}

      {data && !isFetching && chartData.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card flex flex-col items-center justify-center gap-2 py-6">
              <ScoreRing
                score={chartData[chartData.length - 1].score}
                tier={chartData[chartData.length - 1].tier}
              />
              <p className="text-xs text-surface-400">Latest Score</p>
            </div>

            <div className="card flex flex-col items-center justify-center gap-2 py-6">
              <div className={cn(
                'w-16 h-16 rounded-2xl flex items-center justify-center',
                trend > 0 ? 'bg-red-50' : trend < 0 ? 'bg-green-50' : 'bg-surface-50'
              )}>
                {trend > 0
                  ? <TrendingUp size={28} className="text-red-500" />
                  : trend < 0
                  ? <TrendingDown size={28} className="text-green-500" />
                  : <Minus size={28} className="text-surface-400" />}
              </div>
              <p className={cn(
                'text-2xl font-bold',
                trend > 0 ? 'text-red-600' : trend < 0 ? 'text-green-600' : 'text-surface-400'
              )}>
                {trend > 0 ? '+' : ''}{trend.toFixed(0)}
              </p>
              <p className="text-xs text-surface-400">Change over period</p>
            </div>

            <div className="card flex flex-col items-center justify-center gap-2 py-6">
              <p className="text-4xl font-bold text-primary-600">{data.total}</p>
              <p className="text-xs text-surface-400">Total Snapshots</p>
            </div>
          </div>

          {/* Line chart */}
          <div className="card">
            <h3 className="text-base font-semibold text-surface-800 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-primary-500" /> Risk Score Over Time
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 24, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      const cfg = tierConfig(d.tier)
                      return (
                        <div className="bg-white border border-surface-200 rounded-xl p-3 shadow-card-md text-xs space-y-1.5">
                          <p className="font-semibold text-surface-700">{d.date}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold" style={{ color: TIER_COLOR[d.tier] }}>{d.score}</span>
                            <span className={cn('badge', cfg.badge)}>{d.tier}</span>
                          </div>
                          {d.drivers && <p className="text-surface-500 max-w-[200px]">Drivers: {d.drivers}</p>}
                        </div>
                      )
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props
                      return (
                        <circle
                          key={`dot-${cx}-${cy}`}
                          cx={cx} cy={cy} r={5}
                          fill={TIER_COLOR[payload.tier] ?? '#6366f1'}
                          stroke="white"
                          strokeWidth={2}
                        />
                      )
                    }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 justify-center">
              {Object.entries(TIER_COLOR).map(([t, c]) => (
                <div key={t} className="flex items-center gap-1.5 text-xs text-surface-500">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* AI Summary */}
          {latestSnapshot?.ai_summary && (
            <div className="card">
              <h3 className="text-base font-semibold text-surface-800 mb-3 flex items-center gap-2">
                <Info size={16} className="text-primary-500" /> AI Risk Summary
                <span className="text-xs font-normal text-surface-400 ml-1">(latest snapshot)</span>
              </h3>
              <AiSummary markdown={latestSnapshot.ai_summary} />
            </div>
          )}

          {/* Snapshot table */}
          <div className="card">
            <h3 className="text-base font-semibold text-surface-800 mb-4">Snapshot History</h3>
            <div className="overflow-x-auto rounded-xl border border-surface-100">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Score</th>
                    <th>Tier</th>
                    <th>Top Drivers</th>
                    <th>Scored By</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.snapshots]
                    .sort((a, b) => new Date(b.scored_at).getTime() - new Date(a.scored_at).getTime())
                    .map((s: RiskHistorySnapshot, i: number) => {
                      const cfg = tierConfig(s.overall_risk_tier)
                      return (
                        <tr key={i} className={cfg.bg}>
                          <td className="text-xs text-surface-500 whitespace-nowrap">
                            {new Date(s.scored_at).toLocaleString('en-GB', {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </td>
                          <td>
                            <span className={cn('font-bold text-sm', cfg.text)}>{s.overall_risk_score}</span>
                          </td>
                          <td>
                            <span className={cn('badge text-xs', cfg.badge)}>{s.overall_risk_tier}</span>
                          </td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              {s.top_drivers.slice(0, 3).map((d) => (
                                <span key={d} className="text-xs bg-surface-100 text-surface-600 px-1.5 py-0.5 rounded">{d}</span>
                              ))}
                            </div>
                          </td>
                          <td className="text-xs text-surface-400">{s.scored_by}</td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type Tab = 'heatmap' | 'feedback' | 'portfolio' | 'trend'

export default function RiskPage() {
  const [tab, setTab]     = useState<Tab>('heatmap')
  const hasPermission     = useAuthStore((s) => s.hasPermission)
  const canSubmitFeedback = hasPermission('risk_feedback:submit')

  const TABS = [
    { key: 'heatmap',   label: 'Risk Score',     icon: Shield        },
    { key: 'portfolio', label: 'Portfolio',       icon: BarChart3     },
    { key: 'trend',     label: 'Risk Trend',      icon: TrendingUp    },
    ...(canSubmitFeedback ? [{ key: 'feedback', label: 'Submit Feedback', icon: MessageSquare }] : []),
  ] as const

  return (
    <div className="page-container">
      <div>
        <h2 className="page-title">Risk Heatmap</h2>
        <p className="page-subtitle">Project risk scores, portfolio overview, and feedback</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 rounded-xl w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key as Tab)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === key ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700')}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'heatmap'   && <HeatmapTab />}
      {tab === 'portfolio' && <PortfolioTab />}
      {tab === 'trend'     && <TrendTab />}
      {tab === 'feedback'  && <FeedbackTab />}
    </div>
  )
}