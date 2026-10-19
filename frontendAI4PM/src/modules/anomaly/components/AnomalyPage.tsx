import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Upload, FileSpreadsheet, AlertTriangle,
  CheckCircle2, XCircle, Loader2, Trash2, RefreshCw,
  AlertCircle, Tag, Hash,
} from 'lucide-react'
import { anomalyApi } from '@/services/api/anomaly.api'
import type { AnomalyResponse, Anomaly } from '@/services/api/anomaly.api'
import { formatFileSize, cn } from '@/utils'
import toast from 'react-hot-toast'

const ACCEPT = {
  'text/csv': ['.csv'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
}

// ─── Score badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const cls =
    pct >= 80 ? 'bg-red-100    text-red-700   border-red-200'    :
    pct >= 50 ? 'bg-amber-100  text-amber-700 border-amber-200'  :
                'bg-yellow-50  text-yellow-700 border-yellow-200'

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border', cls)}>
      {pct}% anomalous
    </span>
  )
}

// ─── Anomaly card ─────────────────────────────────────────────────────────────
function AnomalyCard({ anomaly, index }: { anomaly: Anomaly; index: number }) {
  const identifierEntries = Object.entries(anomaly.identifiers)

  return (
    <div className="p-4 rounded-xl border border-red-100 bg-red-50 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={14} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-900">Anomaly #{index + 1}</p>
            <p className="text-xs text-surface-500">Row {anomaly.row_number}</p>
          </div>
        </div>
        <ScoreBadge score={anomaly.anomaly_score} />
      </div>

      {/* Identifiers */}
      {identifierEntries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {identifierEntries.map(([key, val]) => (
            <span key={key} className="inline-flex items-center gap-1 text-xs bg-white border border-red-100 text-surface-600 px-2 py-0.5 rounded-md">
              <Tag size={10} className="text-surface-400" />
              <span className="text-surface-400">{key}:</span>
              <span className="font-medium text-surface-700">{val}</span>
            </span>
          ))}
        </div>
      )}

      {/* Reason */}
      <div className="flex items-start gap-2 bg-white border border-red-100 rounded-lg px-3 py-2">
        <AlertCircle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-surface-600 leading-relaxed">{anomaly.anomaly_reason}</p>
      </div>
    </div>
  )
}

// ─── Results ──────────────────────────────────────────────────────────────────
function Results({ result, filename }: { result: AnomalyResponse; filename: string }) {
  const anomalyRate = result.total_rows > 0
    ? Math.round((result.anomaly_count / result.total_rows) * 100)
    : 0

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-surface-900">{result.total_rows}</p>
          <p className="text-xs text-surface-500 mt-0.5">Total Rows</p>
        </div>
        <div className={cn('card text-center py-4', result.anomaly_count > 0 && 'border-red-100 bg-red-50')}>
          <p className={cn('text-2xl font-bold', result.anomaly_count > 0 ? 'text-red-600' : 'text-green-600')}>
            {result.anomaly_count}
          </p>
          <p className="text-xs text-surface-500 mt-0.5">Anomalies Found</p>
        </div>
        <div className="card text-center py-4">
          <p className={cn('text-2xl font-bold', anomalyRate > 20 ? 'text-amber-600' : 'text-surface-900')}>
            {anomalyRate}%
          </p>
          <p className="text-xs text-surface-500 mt-0.5">Anomaly Rate</p>
        </div>
      </div>

      {/* Features used */}
      <div className="card">
        <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Hash size={12} /> Feature Columns Analysed
        </p>
        <div className="flex flex-wrap gap-1.5">
          {result.feature_columns_used.map((col) => (
            <span key={col} className="inline-flex items-center text-xs bg-primary-50 text-primary-700 border border-primary-100 px-2.5 py-1 rounded-lg font-medium">
              {col}
            </span>
          ))}
        </div>
      </div>

      {/* Anomaly list */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-surface-800 flex items-center gap-2">
            {result.anomaly_count > 0
              ? <><AlertTriangle size={16} className="text-red-500" /> Detected Anomalies</>
              : <><CheckCircle2 size={16} className="text-green-500" /> No Anomalies Detected</>
            }
          </h3>
          <span className="text-xs text-surface-400">{filename}</span>
        </div>

        {result.anomaly_count === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
            <CheckCircle2 size={32} className="text-green-400" />
            <p className="text-sm font-medium text-surface-600">All rows look normal</p>
            <p className="text-xs text-surface-400">No anomalies were detected in this dataset</p>
          </div>
        ) : (
          <div className="space-y-3">
            {result.anomalies.map((a, i) => (
              <AnomalyCard key={i} anomaly={a} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type Status = 'idle' | 'uploading' | 'done' | 'error'

export default function AnomalyPage() {
  const [file,     setFile]     = useState<File | null>(null)
  const [status,   setStatus]   = useState<Status>('idle')
  const [result,   setResult]   = useState<AnomalyResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    if (rejected.length) { toast.error('Only CSV or Excel files are supported'); return }
    setFile(accepted[0])
    setStatus('idle')
    setResult(null)
    setErrorMsg('')
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPT, maxFiles: 1, maxSize: 50 * 1024 * 1024,
  })

  const reset = () => { setFile(null); setStatus('idle'); setResult(null); setErrorMsg('') }

  const detect = async () => {
    if (!file) return
    setStatus('uploading')
    setResult(null)
    setErrorMsg('')
    try {
      const { data } = await anomalyApi.detect(file)
      setResult(data)
      setStatus('done')
      toast.success(`Analysis complete — ${data.anomaly_count} anomal${data.anomaly_count !== 1 ? 'ies' : 'y'} found`)
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? err?.response?.data?.message ?? 'Detection failed'
      setErrorMsg(msg)
      setStatus('error')
      toast.error(msg)
    }
  }

  return (
    <div className="page-container max-w-3xl">
      <div>
        <h2 className="page-title">Anomaly Detection</h2>
        <p className="page-subtitle">Upload a metrics CSV or Excel file to detect anomalies</p>
      </div>

      {/* Upload card */}
      <div className="card">
        <h3 className="text-base font-semibold text-surface-800 mb-4 flex items-center gap-2">
          <Upload size={17} className="text-primary-500" /> Upload Metrics File
        </h3>

        {!file ? (
          <div {...getRootProps()} className={cn(
            'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all',
            isDragActive ? 'border-primary-400 bg-primary-50' : 'border-surface-200 hover:border-primary-300 hover:bg-surface-50'
          )}>
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', isDragActive ? 'bg-primary-100' : 'bg-surface-100')}>
                <FileSpreadsheet size={24} className={isDragActive ? 'text-primary-600' : 'text-surface-400'} />
              </div>
              <div>
                <p className="font-semibold text-surface-700">{isDragActive ? 'Drop file here' : 'Drag & drop a CSV or Excel file or click to browse'}</p>
                <p className="text-sm text-surface-400 mt-1">CSV or Excel files supported · Max 50MB</p>
              </div>
              {!isDragActive && <button type="button" className="btn-primary mt-1">Choose File</button>}
            </div>
          </div>
        ) : (
          <div className={cn(
            'flex items-center gap-3 p-4 rounded-xl border transition-colors',
            status === 'done'      && 'bg-green-50   border-green-100',
            status === 'error'     && 'bg-red-50     border-red-100',
            status === 'uploading' && 'bg-primary-50  border-primary-100',
            status === 'idle'      && 'bg-surface-50 border-surface-100',
          )}>
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet size={18} className="text-teal-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-800 truncate">{file.name}</p>
              <p className="text-xs text-surface-400">{formatFileSize(file.size)}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {status === 'uploading' && <Loader2 size={16} className="animate-spin text-primary-500" />}
              {status === 'done'      && <CheckCircle2 size={16} className="text-green-500" />}
              {status === 'error'     && <XCircle size={16} className="text-red-500" />}
              {status !== 'uploading' && (
                <button onClick={reset} className="p-1.5 text-surface-400 hover:text-danger-500 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {status === 'error' && errorMsg && (
          <div className="flex items-center gap-2 mt-3 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            <AlertTriangle size={14} className="flex-shrink-0" /> {errorMsg}
          </div>
        )}

        {file && (
          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-surface-100">
            <button onClick={reset} disabled={status === 'uploading'} className="btn-outline">Clear</button>
            <button onClick={detect} disabled={!file || status === 'uploading'}
              className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed">
              {status === 'uploading'
                ? <><Loader2 size={15} className="animate-spin" /> Analysing…</>
                : status === 'done'
                  ? <><RefreshCw size={15} /> Re-analyse</>
                  : <><AlertTriangle size={15} /> Detect Anomalies</>
              }
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {status === 'done' && result && (
        <Results result={result} filename={file?.name ?? ''} />
      )}
    </div>
  )
}