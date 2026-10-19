import { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Upload, FileText, FileSpreadsheet, CheckCircle2, XCircle,
  Loader2, Trash2, Plus, ChevronDown, Check, Eye, RefreshCw, X, Search,
  Database,
} from 'lucide-react'
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_MB } from '@/constants'
import { formatFileSize, cn, getErrorMessage } from '@/utils'
import { usersApi } from '@/services/api/users.api'
import { ingestionApi, artefactsApi, documentsApi } from '@/services/api/ingestion.api'
import type { ProjectDocument } from '@/services/api/ingestion.api'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/modules/auth/store/authStore'

// ─── Types ────────────────────────────────────────────────────────────────────
type FileStatus = 'pending' | 'uploading' | 'done' | 'error'
interface QueueFile { id: string; file: File; status: FileStatus; progress: number; errorMsg: string }

// ─── File icon helpers ────────────────────────────────────────────────────────
const EXT_ICON: Record<string, string> = {
  pdf:  'bg-red-50    text-red-500',
  doc:  'bg-blue-50   text-blue-500',
  docx: 'bg-blue-50   text-blue-500',
  xls:  'bg-green-50  text-green-500',
  xlsx: 'bg-green-50  text-green-500',
  xlsm: 'bg-green-50  text-green-500',
  xlsb: 'bg-green-50  text-green-500',
  ppt:  'bg-orange-50 text-orange-500',
  pptx: 'bg-orange-50 text-orange-500',
  csv:  'bg-teal-50   text-teal-500',
  txt:  'bg-surface-100 text-surface-500',
}
function getExt(name: string) { return name.split('.').pop()?.toLowerCase() ?? '' }
function FileIcon({ name }: { name: string }) {
  const ext = getExt(name)
  const cls = EXT_ICON[ext] ?? 'bg-surface-100 text-surface-500'
  const Icon = ['xls', 'xlsx', 'xlsm', 'xlsb', 'csv'].includes(ext) ? FileSpreadsheet : FileText
  return <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', cls)}><Icon size={16} /></div>
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function formatBytes(bytes: number) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

// ─── Project combobox — type new name OR select existing ─────────────────────
function ProjectCombo({ options, value, onChange, loading, onDeleteProject }: {
  options: string[]; value: string; onChange: (v: string) => void
  loading?: boolean; onDeleteProject?: (name: string) => void
}) {
  const [open, setOpen] = useState(false)
  const filtered   = options.filter((o) => o.toLowerCase().includes(value.toLowerCase()))
  const exactMatch = options.some((o) => o.toLowerCase() === value.toLowerCase())

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); setOpen(false) }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="relative">
      <div className="input flex items-center gap-1 p-0 overflow-hidden">
        <input type="text" value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={loading ? 'Loading projects…' : 'Type or select a project…'}
          className="flex-1 bg-transparent text-sm text-surface-800 placeholder-surface-400 px-3 py-2.5 focus:outline-none min-w-0" />
        <div className="flex items-center gap-1 pr-2.5 flex-shrink-0">
          {value && (
            <button type="button" onMouseDown={(e) => { e.preventDefault(); onChange('') }}
              className="p-0.5 text-surface-400 hover:text-surface-600"><X size={13} /></button>
          )}
          <ChevronDown size={14} className={cn('text-surface-400 transition-transform cursor-pointer', open && 'rotate-180')}
            onMouseDown={(e) => { e.preventDefault(); setOpen((p) => !p) }} />
        </div>
      </div>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-surface-200 rounded-xl shadow-card-md overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            {value && !exactMatch && (
              <button type="button" onMouseDown={(e) => { e.preventDefault(); onChange(value); setOpen(false) }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-primary-50 border-b border-surface-100 text-left text-primary-600">
                <Plus size={13} /> Use "<strong>{value}</strong>" as new project
              </button>
            )}
            {filtered.length === 0 && !value && (
              <p className="px-4 py-3 text-sm text-surface-400">No projects — type a new name to create one</p>
            )}
            {filtered.map((opt) => (
              <div key={opt} className="flex items-center group hover:bg-surface-50 transition-colors">
                <button type="button" onMouseDown={(e) => { e.preventDefault(); onChange(opt); setOpen(false) }}
                  className="flex-1 flex items-center justify-between px-4 py-2.5 text-sm text-left">
                  <span className={value === opt ? 'text-primary-700 font-medium' : 'text-surface-700'}>{opt}</span>
                  {value === opt && <Check size={14} className="text-primary-600 flex-shrink-0" />}
                </button>
                {onDeleteProject && (
                  <button type="button"
                    onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onDeleteProject(opt) }}
                    className="opacity-0 group-hover:opacity-100 pr-3 p-1 text-danger-400 hover:text-danger-600 transition-all"
                    title={`Delete ${opt}`}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-surface-100 text-xs text-surface-400">
            Select existing or type a new project name
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Artefacts Tab ────────────────────────────────────────────────────────────
function ArtefactsTab() {
  const [project, setProject] = useState('')
  const queryClient       = useQueryClient()
  const canDeleteProject  = useAuthStore((s) => s.hasPermission)('admin:all')

  const { mutate: deleteProject } = useMutation({
    mutationFn: (name: string) => usersApi.deleteProject(name),
    onSuccess:  (_, name) => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success(`Project "${name}" deleted`); if (project === name) setProject('') },
    onError:    () => toast.error('Failed to delete project'),
  })
  const handleDeleteProjectArtefacts = (name: string) => {
    if (window.confirm(`Delete project "${name}"? This cannot be undone.`)) deleteProject(name)
  }

  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn:  () => usersApi.getProjects().then((r) => r.data.projects),
  })
  const projectOptions = (projectsData ?? []).map((p) => p.project_name)

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['artefacts', project],
    queryFn:  () => artefactsApi.getAll(project).then((r) => r.data),
    enabled:  !!project,
    staleTime: 0,
    gcTime:    0,
  })

  const artefacts = data?.artefacts ?? []

  return (
    <div className="space-y-5">
      <div className="card">
        <h3 className="text-base font-semibold text-surface-800 mb-1">Select Project</h3>
        <p className="text-xs text-surface-400 mb-3">View all ingested artefacts for a project</p>
        <div className="flex gap-3">
          <div className="flex-1">
            <ProjectCombo
              options={projectOptions}
              value={project}
              onChange={setProject}
              loading={loadingProjects}
              onDeleteProject={canDeleteProject ? handleDeleteProjectArtefacts : undefined}
            />
          </div>
          {project && (
            <button onClick={() => refetch()} disabled={isFetching} className="btn-outline px-3" title="Refresh">
              <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {!project && (
        <div className="card flex flex-col items-center justify-center py-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mb-3">
            <Eye size={20} className="text-surface-400" />
          </div>
          <p className="text-sm font-medium text-surface-600">Select or type a project to view its artefacts</p>
        </div>
      )}

      {project && (isLoading || isFetching) && (
        <div className="card flex items-center justify-center py-14 gap-2 text-surface-400 text-sm">
          <Loader2 size={18} className="animate-spin" /> Loading artefacts…
        </div>
      )}

      {project && isError && !isFetching && (
        <div className="card text-center py-14 text-danger-500 text-sm">
          Failed to load artefacts. <button onClick={() => refetch()} className="underline">Retry</button>
        </div>
      )}

      {project && !isLoading && !isFetching && !isError && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-surface-800">Artefacts</h3>
              <span className="badge badge-neutral">{data?.total ?? 0} total</span>
            </div>
          </div>
          {artefacts.length === 0 ? (
            <div className="text-center py-10 text-surface-400 text-sm">No artefacts found for this project</div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Type</th>
                    <th>Word Count</th>
                    <th>Ingested At</th>
                  </tr>
                </thead>
                <tbody>
                  {artefacts.map((a, i) => (
                    <tr key={`${a.filename}-${i}`}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <FileIcon name={a.filename} />
                          <span className="text-sm font-medium text-surface-800 truncate max-w-[220px]">{a.filename}</span>
                        </div>
                      </td>
                      <td>
                        <span className={cn('badge', a.artefact_type === 'Unknown' ? 'badge-neutral' : 'badge-primary')}>
                          {a.artefact_type}
                        </span>
                      </td>
                      <td className="text-sm text-surface-600">{a.word_count.toLocaleString()}</td>
                      <td className="text-xs text-surface-500 whitespace-nowrap">{formatDate(a.ingested_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Upload Tab ───────────────────────────────────────────────────────────────
function UploadTab() {
  const [project,   setProject]   = useState('')
  const [queue,     setQueue]     = useState<QueueFile[]>([])
  const [uploading, setUploading] = useState(false)
  const queryClient = useQueryClient()

  const { mutate: deleteProject } = useMutation({
    mutationFn: (name: string) => usersApi.deleteProject(name),
    onSuccess:  (_, name) => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success(`Project "${name}" deleted`); if (project === name) setProject('') },
    onError:    () => toast.error('Failed to delete project'),
  })
  const canDeleteProject = useAuthStore((s) => s.hasPermission)('admin:all')

  const handleDeleteProject = (name: string) => {
    if (!canDeleteProject) return
    if (window.confirm(`Delete project "${name}"? This cannot be undone.`)) deleteProject(name)
  }

  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn:  () => usersApi.getProjects().then((r) => r.data.projects),
  })
  const projectOptions = (projectsData ?? []).map((p) => p.project_name)

  const updateFile = (id: string, patch: Partial<QueueFile>) =>
    setQueue((prev) => prev.map((f) => f.id === id ? { ...f, ...patch } : f))

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    rejected.forEach((r) => toast.error(`${r.file.name}: ${r.errors[0]?.message ?? 'Invalid file'}`))
    setQueue((prev) => [
      ...prev,
      ...accepted.map((f) => ({ id: Math.random().toString(36).slice(2), file: f, status: 'pending' as FileStatus, progress: 0, errorMsg: '' })),
    ])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept:  ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
  })

  const remove    = (id: string) => setQueue((prev) => prev.filter((f) => f.id !== id))
  const clearDone = () => setQueue((prev) => prev.filter((f) => f.status !== 'done'))

  const pendingFiles = queue.filter((f) => f.status === 'pending')
  const doneCount    = queue.filter((f) => f.status === 'done').length
  const errorCount   = queue.filter((f) => f.status === 'error').length

  const handleUpload = async () => {
    if (!project) { toast.error('Please select or enter a project first'); return }
    if (pendingFiles.length === 0) { toast.error('No pending files to upload'); return }

    setUploading(true)
    pendingFiles.forEach((f) => updateFile(f.id, { status: 'uploading', progress: 0 }))

    try {
      const { data } = await ingestionApi.ingest(project, pendingFiles.map((f) => f.file), (pct) => {
        pendingFiles.forEach((f) => updateFile(f.id, { progress: pct }))
      })

      data.files.forEach((result) => {
        const match = pendingFiles.find((f) => f.file.name === result.filename)
        if (match) updateFile(match.id, { status: result.status === 'success' ? 'done' : 'error', progress: 100, errorMsg: result.status !== 'success' ? 'Failed to ingest' : '' })
      })

      data.failures.forEach((failure) => {
        const match = pendingFiles.find((f) => f.file.name === failure.filename)
        if (match) updateFile(match.id, { status: 'error', progress: 100, errorMsg: failure.error })
      })

      pendingFiles.forEach((f) => {
        const inFiles    = data.files.find((r) => r.filename === f.file.name)
        const inFailures = data.failures.find((r) => r.filename === f.file.name)
        if (!inFiles && !inFailures) updateFile(f.id, { status: 'done', progress: 100 })
      })

      if (data.ingested > 0) toast.success(`${data.ingested} file${data.ingested !== 1 ? 's' : ''} ingested into "${data.project_name}"`)
      if (data.failed   > 0) toast.error(`${data.failed} file${data.failed !== 1 ? 's' : ''} failed — check the queue for details`)
    } catch (err: any) {
      pendingFiles.forEach((f) => updateFile(f.id, { status: 'error', errorMsg: 'Upload failed' }))
      toast.error(err?.response?.data?.detail ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="card">
        <h3 className="text-base font-semibold text-surface-800 mb-1 flex items-center gap-1">
          Select Project <span className="text-danger-500 text-sm">*</span>
        </h3>
        <p className="text-xs text-surface-400 mb-3">Type a project name or select an existing one. All files go to this project.</p>
        <ProjectCombo
          options={projectOptions}
          value={project}
          onChange={setProject}
          loading={loadingProjects}
          onDeleteProject={canDeleteProject ? handleDeleteProject : undefined}
        />
      </div>

      <div {...getRootProps()} className={cn(
        'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all',
        isDragActive ? 'border-primary-400 bg-primary-50' : 'border-surface-200 hover:border-primary-300 hover:bg-surface-50'
      )}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', isDragActive ? 'bg-primary-100' : 'bg-surface-100')}>
            <Upload size={24} className={isDragActive ? 'text-primary-600' : 'text-surface-400'} />
          </div>
          <div>
            <p className="font-semibold text-surface-700">{isDragActive ? 'Drop files here' : 'Drag & drop files or click to browse'}</p>
            <p className="text-sm text-surface-400 mt-1">PDF, DOC, DOCX, XLS, XLSX, XLSM, XLSB, PPT, PPTX, CSV, TXT · Max {MAX_FILE_SIZE_MB}MB per file</p>
          </div>
          {!isDragActive && <button type="button" className="btn-primary mt-1">Choose Files</button>}
        </div>
      </div>

      {queue.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-surface-800">Upload Queue</h3>
              <span className="badge badge-neutral">{queue.length} file{queue.length !== 1 ? 's' : ''}</span>
              {doneCount  > 0 && <span className="badge badge-success">{doneCount} done</span>}
              {errorCount > 0 && <span className="badge badge-danger">{errorCount} failed</span>}
            </div>
            {doneCount > 0 && <button onClick={clearDone} className="text-xs text-surface-400 hover:text-surface-700">Clear completed</button>}
          </div>

          <div className="space-y-2">
            {queue.map(({ id, file, status, progress, errorMsg }) => (
              <div key={id} className={cn(
                'flex items-center gap-3 p-3 rounded-xl border transition-colors',
                status === 'done'      && 'bg-green-50   border-green-100',
                status === 'error'     && 'bg-red-50     border-red-100',
                status === 'uploading' && 'bg-primary-50  border-primary-100',
                status === 'pending'   && 'bg-surface-50 border-surface-100',
              )}>
                <FileIcon name={file.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-medium text-surface-800 truncate">{file.name}</p>
                    <span className="text-xs text-surface-400 ml-2 flex-shrink-0">{formatFileSize(file.size)}</span>
                  </div>
                  {status === 'uploading' && (
                    <>
                      <div className="w-full bg-primary-100 rounded-full h-1.5 mt-1">
                        <div className="bg-primary-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-xs text-primary-500 mt-0.5">{progress}%</p>
                    </>
                  )}
                  {status === 'error' && errorMsg && <p className="text-xs text-red-500 mt-0.5">{errorMsg}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {status === 'pending'   && <span className="badge badge-neutral text-xs">Pending</span>}
                  {status === 'uploading' && <Loader2 size={16} className="animate-spin text-primary-500" />}
                  {status === 'done'      && <CheckCircle2 size={16} className="text-green-500" />}
                  {status === 'error'     && <XCircle size={16} className="text-red-500" />}
                  {status !== 'uploading' && (
                    <button onClick={() => remove(id)} className="p-1 text-surface-400 hover:text-danger-500 rounded transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-5 pt-4 border-t border-surface-100">
            <button onClick={() => setQueue([])} disabled={uploading} className="text-sm text-surface-400 hover:text-danger-500 transition-colors disabled:opacity-40">Clear all</button>
            <div className="flex items-center gap-3">
              {!project && <p className="text-xs text-amber-500">Enter or select a project to enable upload</p>}
              <button onClick={handleUpload} disabled={uploading || pendingFiles.length === 0 || !project}
                className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed">
                {uploading
                  ? <><Loader2 size={15} className="animate-spin" /> Uploading…</>
                  : <><Upload size={15} /> Upload {pendingFiles.length > 0 ? `${pendingFiles.length} file${pendingFiles.length !== 1 ? 's' : ''}` : ''}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Confirm delete document dialog ───────────────────────────────────────────
function ConfirmDeleteDocDialog({ doc, onConfirm, onCancel, isPending }: {
  doc: ProjectDocument
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-full bg-danger-50 flex items-center justify-center flex-shrink-0">
            <Trash2 size={18} className="text-danger-500" />
          </div>
          <button onClick={onCancel} className="text-surface-400 hover:text-surface-700 transition-colors">
            <X size={18} />
          </button>
        </div>
        <h3 className="text-base font-semibold text-surface-900 mb-1">Delete Document</h3>
        <p className="text-sm text-surface-500 mb-6">
          Are you sure you want to delete <strong className="text-surface-800 break-all">{doc.filename}</strong>?
          {' '}This will remove it and its {doc.chunk_count} indexed chunk{doc.chunk_count !== 1 ? 's' : ''} from the project. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-outline flex-1" disabled={isPending}>Cancel</button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-danger-500 hover:bg-danger-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-60"
          >
            {isPending ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Documents Tab ────────────────────────────────────────────────────────────
function DocumentsTab() {
  const [project, setProject] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ProjectDocument | null>(null)
  const queryClient = useQueryClient()
  const canDelete   = useAuthStore((s) => s.hasPermission)('admin:all')

  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn:  () => usersApi.getProjects().then((r) => r.data.projects),
  })
  const projectOptions = (projectsData ?? []).map((p) => p.project_name)

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['project-documents', project],
    queryFn:  () => documentsApi.getAll(project).then((r) => r.data),
    enabled:  !!project,
    staleTime: 0,
    gcTime:    0,
  })

  const { mutate: deleteDoc, isPending: isDeleting } = useMutation({
    mutationFn: (docId: string) => documentsApi.delete(project, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', project] })
      toast.success('Document deleted')
      setDeleteTarget(null)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const documents = data?.documents ?? []

  return (
    <div className="space-y-5">
      <div className="card">
        <h3 className="text-base font-semibold text-surface-800 mb-1">Select Project</h3>
        <p className="text-xs text-surface-400 mb-3">View and manage indexed documents for a project</p>
        <div className="flex gap-3">
          <div className="flex-1">
            <ProjectCombo options={projectOptions} value={project} onChange={setProject} loading={loadingProjects} />
          </div>
          {project && (
            <button onClick={() => refetch()} disabled={isFetching} className="btn-outline px-3" title="Refresh">
              <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {!project && (
        <div className="card flex flex-col items-center justify-center py-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mb-3">
            <Database size={20} className="text-surface-400" />
          </div>
          <p className="text-sm font-medium text-surface-600">Select a project to manage its documents</p>
        </div>
      )}

      {project && (isLoading || isFetching) && (
        <div className="card flex items-center justify-center py-14 gap-2 text-surface-400 text-sm">
          <Loader2 size={18} className="animate-spin" /> Loading documents…
        </div>
      )}

      {project && isError && !isFetching && (
        <div className="card text-center py-14 text-danger-500 text-sm">
          Failed to load documents. <button onClick={() => refetch()} className="underline">Retry</button>
        </div>
      )}

      {project && data && !isFetching && !isError && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card text-center py-4">
              <p className="text-xl font-bold text-surface-800">{data.stats.doc_count}</p>
              <p className="text-xs text-surface-400 mt-0.5">Documents</p>
            </div>
            <div className="card text-center py-4">
              <p className="text-xl font-bold text-surface-800">{data.stats.total_chunks}</p>
              <p className="text-xs text-surface-400 mt-0.5">Chunks</p>
            </div>
            <div className="card text-center py-4">
              <p className="text-xl font-bold text-surface-800">{formatBytes(data.stats.total_size_bytes)}</p>
              <p className="text-xs text-surface-400 mt-0.5">Total Size</p>
            </div>
            <div className="card py-4 px-4">
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1.5">By Type</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(data.stats.by_type).map(([type, count]) => (
                  <span key={type} className="text-xs bg-surface-100 text-surface-600 px-1.5 py-0.5 rounded uppercase">{type}: {count}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Document table */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-base font-semibold text-surface-800">Documents</h3>
              <span className="badge badge-neutral">{data.total} total</span>
              {!canDelete && <span className="text-xs text-surface-400">· Admin permission required to delete</span>}
            </div>
            {documents.length === 0 ? (
              <div className="text-center py-10 text-surface-400 text-sm">No documents found for this project</div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Type</th>
                      <th>Size</th>
                      <th>Chunks</th>
                      <th>Uploaded At</th>
                      <th>Status</th>
                      {canDelete && <th></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <FileIcon name={d.filename} />
                            <span className="text-sm font-medium text-surface-800 truncate max-w-[220px]">{d.filename}</span>
                          </div>
                        </td>
                        <td><span className="badge badge-neutral text-xs uppercase">{d.file_type}</span></td>
                        <td className="text-sm text-surface-600">{formatBytes(d.file_size)}</td>
                        <td className="text-sm text-surface-600">{d.chunk_count}</td>
                        <td className="text-xs text-surface-500 whitespace-nowrap">{formatDate(d.uploaded_at)}</td>
                        <td>
                          <span className={cn('badge text-xs', d.status === 'indexed' ? 'badge-success' : 'badge-neutral')}>{d.status}</span>
                        </td>
                        {canDelete && (
                          <td>
                            <button onClick={() => setDeleteTarget(d)}
                              className="p-1.5 text-surface-400 hover:text-danger-500 rounded-lg transition-colors" title="Delete document">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {deleteTarget && (
        <ConfirmDeleteDocDialog
          doc={deleteTarget}
          onConfirm={() => deleteDoc(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          isPending={isDeleting}
        />
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type Tab = 'upload' | 'artefacts' | 'documents'

export default function IngestionPage() {
  const [tab, setTab] = useState<Tab>('upload')
  const canManageDocuments = useAuthStore((s) => s.hasPermission)('admin:all')

  return (
    <div className="page-container max-w-3xl">
      <div>
        <h2 className="page-title">Data Ingestion</h2>
        <p className="page-subtitle">Upload artefact files and view indexed documents</p>
      </div>

      <div className="flex gap-1 p-1 bg-surface-100 rounded-xl w-fit">
        <button onClick={() => setTab('upload')}
          className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            tab === 'upload' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700')}>
          <Upload size={15} /> Upload
        </button>
        <button onClick={() => setTab('artefacts')}
          className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            tab === 'artefacts' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700')}>
          <Eye size={15} /> View Artefacts
        </button>
        {canManageDocuments && (
          <button onClick={() => setTab('documents')}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === 'documents' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700')}>
            <Database size={15} /> Manage Documents
          </button>
        )}
      </div>

      {tab === 'upload'    && <UploadTab />}
      {tab === 'artefacts' && <ArtefactsTab />}
      {tab === 'documents' && <DocumentsTab />}
    </div>
  )
}