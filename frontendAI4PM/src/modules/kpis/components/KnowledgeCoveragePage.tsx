import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen, RefreshCw, Loader2, AlertCircle, AlertTriangle,
  CheckCircle2, XCircle, PlusCircle,
} from 'lucide-react'
import { cn, getErrorMessage } from '@/utils'
import { kpiApi } from '@/services/api/kpi.api'
import ProjectSelect from './ProjectSelect'
import KpiInfoButton from './KpiInfoButton'

const TIER_CONFIG: Record<string, { text: string; ring: string; badge: string }> = {
  strong:   { text: 'text-green-600', ring: '#22c55e', badge: 'bg-green-100  text-green-700'  },
  moderate: { text: 'text-amber-600', ring: '#f59e0b', badge: 'bg-amber-100  text-amber-700'  },
  weak:     { text: 'text-red-600',   ring: '#ef4444', badge: 'bg-red-100    text-red-700'    },
}

function coverageTier(tier: string) {
  return TIER_CONFIG[tier.toLowerCase()] ?? { text: 'text-surface-600', ring: '#94a3b8', badge: 'bg-surface-100 text-surface-600' }
}

function ScoreRing({ score, tier }: { score: number; tier: string }) {
  const cfg  = coverageTier(tier)
  const r    = 40
  const circ = 2 * Math.PI * r
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circ

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none"
          stroke={cfg.ring} strokeWidth="8" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="text-center">
        <p className={cn('text-2xl font-bold', cfg.text)}>{score}</p>
        <p className="text-xs text-surface-400">/ 100</p>
      </div>
    </div>
  )
}

export default function KnowledgeCoveragePage() {
  const [project, setProject] = useState('')

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['knowledge-coverage', project],
    queryFn:  () => kpiApi.getKnowledgeCoverage(project).then((r) => r.data),
    enabled:  !!project,
    staleTime: 0,
    retry: false,
  })

  const errorMsg = data ? '' : getErrorMessage(error) || 'Failed to load knowledge coverage'

  return (
    <div className="page-container">
      <div>
        <h2 className="page-title">Knowledge Coverage Score</h2>
        <p className="page-subtitle">Completeness of project documentation against an expected artefact-type template</p>
      </div>

      <div className="card">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[220px]">
            <label className="label mb-1">Project</label>
            <ProjectSelect value={project} onChange={setProject} />
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
            <BookOpen size={22} className="text-primary-500" />
          </div>
          <p className="text-sm font-medium text-surface-600">Select a project to view its knowledge coverage</p>
        </div>
      )}

      {project && (isLoading || isFetching) && (
        <div className="card flex items-center justify-center py-16 gap-2 text-surface-400 text-sm">
          <Loader2 size={18} className="animate-spin" /> Loading knowledge coverage…
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
              <h3 className="text-base font-semibold text-surface-800">Knowledge Coverage</h3>
              <KpiInfoButton description={data.kpi_info.description} whyItMatters={data.kpi_info.why_it_matters} />
            </div>
            <div className="flex flex-col items-center gap-3">
              <ScoreRing score={data.knowledge_coverage_score} tier={data.tier} />
              <span className={cn('badge capitalize', coverageTier(data.tier).badge)}>{data.tier}</span>
            </div>
          </div>

          {/* Artefact breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-surface-700 mb-3">
                <CheckCircle2 size={15} className="text-green-500" /> Present Artefacts
                <span className="badge badge-neutral text-xs">{data.present_artefacts.length}</span>
              </h4>
              {data.present_artefacts.length === 0
                ? <p className="text-sm text-surface-400">None found</p>
                : <ul className="space-y-1.5">
                    {data.present_artefacts.map((a) => (
                      <li key={a} className="text-sm text-surface-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />{a}
                      </li>
                    ))}
                  </ul>
              }
            </div>

            <div className="card">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-surface-700 mb-3">
                <XCircle size={15} className="text-red-500" /> Missing Artefacts
                <span className="badge badge-neutral text-xs">{data.missing_artefacts.length}</span>
              </h4>
              {data.missing_artefacts.length === 0
                ? <p className="text-sm text-surface-400">None — fully covered</p>
                : <ul className="space-y-1.5">
                    {data.missing_artefacts.map((a) => (
                      <li key={a} className="text-sm text-surface-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />{a}
                      </li>
                    ))}
                  </ul>
              }
            </div>

            <div className="card">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-surface-700 mb-3">
                <PlusCircle size={15} className="text-blue-500" /> Extra Artefacts
                <span className="badge badge-neutral text-xs">{data.extra_artefacts.length}</span>
              </h4>
              {data.extra_artefacts.length === 0
                ? <p className="text-sm text-surface-400">None</p>
                : <ul className="space-y-1.5">
                    {data.extra_artefacts.map((a) => (
                      <li key={a} className="text-sm text-surface-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />{a}
                      </li>
                    ))}
                  </ul>
              }
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
