import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Lightbulb, Tag, Send, Loader2, RefreshCw,
  ChevronDown, Check, Search, X, Eye,
} from 'lucide-react'
import { cn, getErrorMessage } from '@/utils'
import { usersApi } from '@/services/api/users.api'
import { innovationsApi } from '@/services/api/innovations.api'
import type { Innovation } from '@/services/api/innovations.api'
import toast from 'react-hot-toast'

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ['general', 'process', 'technology', 'product', 'people', 'other']

const CATEGORY_BADGE: Record<string, string> = {
  general:    'bg-surface-100  text-surface-600',
  process:    'bg-blue-50      text-blue-700',
  technology: 'bg-purple-50    text-purple-700',
  product:    'bg-teal-50      text-teal-700',
  people:     'bg-orange-50    text-orange-700',
  other:      'bg-surface-100  text-surface-600',
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  project_name: z.string().min(1, 'Please select a project'),
  title:        z.string().min(5, 'Title must be at least 5 characters'),
  description:  z.string().min(20, 'Description must be at least 20 characters'),
  category:     z.array(z.string()).min(1, 'Please select at least one category'),
  tags:         z.array(z.string()),
  benefits:     z.string().min(10, 'Benefits should have at least 10 characters'),
})
type FormValues = z.infer<typeof schema>

// ─── Project Dropdown ─────────────────────────────────────────────────────────
function ProjectSelect({ value, onChange, hasError }: { value: string; onChange: (v: string) => void; hasError?: boolean }) {
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
        className={cn('input flex items-center justify-between text-left w-full', !value && 'text-surface-400', hasError && 'input-error')}>
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
              {filtered.length === 0 && <p className="px-4 py-3 text-sm text-surface-400">No projects found</p>}
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

// ─── Tag input ────────────────────────────────────────────────────────────────
function TagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('')

  const add = () => {
    const tag = input.trim()
    if (tag && !value.includes(tag)) onChange([...value, tag])
    setInput('')
  }

  const remove = (t: string) => onChange(value.filter((v) => v !== t))

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Add a tag and press Enter…"
          className="input flex-1"
        />
        <button type="button" onClick={add} disabled={!input.trim()} className="btn-outline px-3 disabled:opacity-40">
          <Plus size={14} />
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {value.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-lg font-medium">
              <Tag size={10} /> {tag}
              <button type="button" onClick={() => remove(tag)} className="hover:text-primary-900 ml-0.5"><X size={11} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Innovation detail modal ──────────────────────────────────────────────────
function InnovationDetailModal({ item, onClose }: { item: Innovation; onClose: () => void }) {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const categories = item.category.split(',').map((c) => c.trim()).filter(Boolean)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-900/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-card-md max-w-xl w-full max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-surface-100">
          <div>
            <div className="flex flex-wrap gap-1 mb-2">
              {categories.map((cat) => (
                <span key={cat} className={cn('badge text-xs capitalize', CATEGORY_BADGE[cat] ?? CATEGORY_BADGE.other)}>{cat}</span>
              ))}
            </div>
            <h3 className="text-lg font-semibold text-surface-900 leading-snug">{item.title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1.5">Description</p>
            <p className="text-sm text-surface-700 leading-relaxed whitespace-pre-wrap">{item.description}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1.5">Benefits</p>
            <p className="text-sm text-surface-700 leading-relaxed whitespace-pre-wrap">{item.benefits}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1.5">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.length > 0
                ? item.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 text-xs bg-surface-100 text-surface-600 px-2 py-0.5 rounded-md">
                      <Tag size={10} /> {tag}
                    </span>
                  ))
                : <span className="text-xs text-surface-300">No tags</span>
              }
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-surface-100 text-xs text-surface-400">
            <span>Project: <span className="font-medium text-surface-600 capitalize">{item.project_name}</span></span>
            <span>By <span className="font-medium text-surface-600">{item.submitted_by}</span> · {formatDate(item.submitted_at)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Innovation card ──────────────────────────────────────────────────────────
function InnovationCard({ item }: { item: Innovation }) {
  const [showDetail, setShowDetail] = useState(false)

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  const categories = item.category.split(',').map((c) => c.trim()).filter(Boolean)

  return (
    <>
      <div onClick={() => setShowDetail(true)}
        className="card hover:shadow-card-md hover:border-primary-100 transition-all cursor-pointer">
        <div className="flex items-start justify-between mb-2 gap-2">
          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <span key={cat} className={cn('badge text-xs capitalize', CATEGORY_BADGE[cat] ?? CATEGORY_BADGE.other)}>
                {cat}
              </span>
            ))}
          </div>
          <span className="text-xs text-surface-400 flex-shrink-0">{formatDate(item.submitted_at)}</span>
        </div>

        <h4 className="font-semibold text-surface-900 mb-1.5 leading-snug">{item.title}</h4>

        <p className="text-sm text-surface-500 leading-relaxed line-clamp-2">
          {item.description}
        </p>
        {item.description.length > 120 && (
          <span className="text-xs text-primary-500 mt-1 inline-block">Click to view full details</span>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-100">
          <div className="flex flex-wrap gap-1">
            {item.tags.length > 0
              ? item.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 text-xs bg-surface-100 text-surface-600 px-2 py-0.5 rounded-md">
                    <Tag size={10} /> {tag}
                  </span>
                ))
              : <span className="text-xs text-surface-300">No tags</span>
            }
          </div>
          <span className="text-xs text-surface-400 flex-shrink-0 ml-2 truncate max-w-[100px]" title={item.submitted_by}>
            {item.submitted_by}
          </span>
        </div>
      </div>

      {showDetail && <InnovationDetailModal item={item} onClose={() => setShowDetail(false)} />}
    </>
  )
}

// ─── Submit Tab ───────────────────────────────────────────────────────────────
function SubmitTab({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient()

  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { project_name: '', title: '', description: '', category: [], tags: [], benefits: '' },
  })

  const tags        = watch('tags')
  const projectName = watch('project_name')
  const category    = watch('category')

  const toggleCategory = (cat: string) => {
    const next = category.includes(cat) ? category.filter((c) => c !== cat) : [...category, cat]
    setValue('category', next, { shouldValidate: true })
  }

  const { mutate: submit, isPending } = useMutation({
    mutationFn: (values: FormValues) => innovationsApi.submit({ ...values, category: values.category.join(',') }),
    onSuccess: (data) => {
      toast.success(data.data.message)
      queryClient.invalidateQueries({ queryKey: ['innovations'] })
      reset()
      onSuccess()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const onInvalid = (errs: typeof errors) => {
    const first = Object.values(errs)[0]?.message
    if (first) toast.error(String(first))
  }

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit((v) => submit(v), onInvalid)} noValidate>
        <div className="space-y-5">

          <div className="card">
            <h3 className="text-base font-semibold text-surface-800 mb-4 flex items-center gap-2">
              <Lightbulb size={17} className="text-primary-500" /> Innovation Details
            </h3>
            <div className="space-y-4">

              <div>
                <label className="label">Project <span className="text-danger-500">*</span></label>
                <ProjectSelect value={projectName} onChange={(v) => setValue('project_name', v, { shouldValidate: true })} hasError={!!errors.project_name} />
                {errors.project_name && <p className="error-text">{errors.project_name.message}</p>}
              </div>

              <div>
                <label className="label">Title <span className="text-danger-500">*</span></label>
                <input {...register('title')} placeholder="Give your innovation a clear, catchy title"
                  className={cn('input', errors.title && 'input-error')} />
                {errors.title && <p className="error-text">{errors.title.message}</p>}
              </div>

              <div>
                <label className="label">Description <span className="text-danger-500">*</span></label>
                <textarea {...register('description')} rows={4}
                  placeholder="Describe the innovation, its impact, and how it was implemented…"
                  className={cn('input resize-none', errors.description && 'input-error')} />
                {errors.description && <p className="error-text">{errors.description.message}</p>}
              </div>

              <div>
                <label className="label">Benefits <span className="text-danger-500">*</span></label>
                <textarea {...register('benefits')} rows={3}
                  placeholder="Describe the measurable benefits of this innovation…"
                  className={cn('input resize-none', errors.benefits && 'input-error')} />
                {errors.benefits && <p className="error-text">{errors.benefits.message}</p>}
              </div>

              <div>
                <label className="label">Categories <span className="text-danger-500">*</span>
                  <span className="text-surface-400 font-normal ml-1">(select one or more)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button key={cat} type="button"
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-sm font-medium border transition-all capitalize flex items-center gap-1.5',
                        category.includes(cat)
                          ? 'border-primary-400 bg-primary-50 text-primary-700'
                          : 'border-surface-200 text-surface-500 hover:border-surface-300'
                      )}>
                      {category.includes(cat) && <Check size={13} />}
                      {cat}
                    </button>
                  ))}
                </div>
                {errors.category && <p className="error-text">{errors.category.message}</p>}
              </div>

              <div>
                <label className="label">Tags <span className="text-surface-400 font-normal">(optional)</span></label>
                <TagInput value={tags} onChange={(v) => setValue('tags', v)} />
              </div>

            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => reset()} className="btn-outline">Reset</button>
            <button type="submit" disabled={isPending} className="btn-primary px-6">
              {isPending ? <><Loader2 size={15} className="animate-spin" /> Submitting…</> : <><Send size={15} /> Submit Innovation</>}
            </button>
          </div>

        </div>
      </form>
    </div>
  )
}

// ─── View Tab ─────────────────────────────────────────────────────────────────
function ViewTab() {
  const [project,    setProject]    = useState('')
  const [catFilter,  setCatFilter]  = useState('')
  const [search,     setSearch]     = useState('')
  const [dropOpen,   setDropOpen]   = useState(false)
  const [dropSearch, setDropSearch] = useState('')

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn:  () => usersApi.getProjects().then((r) => r.data.projects),
  })
  const projectOptions = (projectsData ?? []).map((p) => p.project_name)
  const filteredProjects = projectOptions.filter((p) => p.toLowerCase().includes(dropSearch.toLowerCase()))

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['innovations', project],
    queryFn:  () => innovationsApi.getAll(project).then((r) => r.data),
    enabled:  !!project,
    staleTime: 0,
  })

  const innovations = (data?.innovations ?? []).filter((i) => {
    const matchCat    = catFilter ? i.category.split(',').map((c) => c.trim()).includes(catFilter) : true
    const matchSearch = search ? i.title.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()) : true
    return matchCat && matchSearch
  })

  return (
    <div className="space-y-5">
      {/* Filters bar */}
      <div className="flex flex-wrap gap-3 items-center">

        {/* Project dropdown */}
        <div className="relative">
          <button type="button" onClick={() => { setDropOpen((p) => !p); setDropSearch('') }}
            className={cn('input flex items-center gap-2 w-48', !project && 'text-surface-400')}>
            <span className="flex-1 truncate text-sm">{project || 'Select project…'}</span>
            <ChevronDown size={14} className={cn('flex-shrink-0 text-surface-400 transition-transform', dropOpen && 'rotate-180')} />
          </button>
          {dropOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropOpen(false)} />
              <div className="absolute z-20 mt-1 w-48 bg-white border border-surface-200 rounded-xl shadow-card-md overflow-hidden">
                <div className="p-2 border-b border-surface-100">
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input autoFocus type="text" value={dropSearch} onChange={(e) => setDropSearch(e.target.value)}
                      placeholder="Search…"
                      className="w-full pl-6 pr-2 py-1.5 text-xs border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                      onClick={(e) => e.stopPropagation()} />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredProjects.length === 0 && <p className="px-3 py-2 text-xs text-surface-400">No projects</p>}
                  {filteredProjects.map((p) => (
                    <button key={p} type="button" onClick={() => { setProject(p); setDropOpen(false) }}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-surface-50 transition-colors text-left">
                      <span className={project === p ? 'text-primary-700 font-medium' : 'text-surface-700'}>{p}</span>
                      {project === p && <Check size={13} className="text-primary-600" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Category filter */}
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="input w-36 text-sm">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input placeholder="Search title or description…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 w-full text-sm" />
        </div>

        {project && (
          <button onClick={() => refetch()} disabled={isFetching} className="btn-outline px-3" title="Refresh">
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {/* Empty / loading states */}
      {!project && (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mb-3">
            <Eye size={20} className="text-surface-400" />
          </div>
          <p className="text-sm font-medium text-surface-600">Select a project to view innovations</p>
        </div>
      )}

      {project && (isLoading || isFetching) && (
        <div className="card flex items-center justify-center py-16 gap-2 text-surface-400 text-sm">
          <Loader2 size={18} className="animate-spin" /> Loading innovations…
        </div>
      )}

      {project && isError && !isFetching && (
        <div className="card text-center py-16 text-danger-500 text-sm">
          Failed to load. <button onClick={() => refetch()} className="underline">Retry</button>
        </div>
      )}

      {project && !isLoading && !isFetching && !isError && (
        <>
          <div className="flex items-center gap-2">
            <span className="badge badge-neutral">{innovations.length} innovation{innovations.length !== 1 ? 's' : ''}</span>
            {catFilter && <button onClick={() => setCatFilter('')} className="text-xs text-surface-400 hover:text-surface-700">Clear filter</button>}
          </div>

          {innovations.length === 0 ? (
            <div className="card text-center py-12 text-surface-400 text-sm">No innovations found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {innovations.map((item) => <InnovationCard key={item.id} item={item} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type Tab = 'submit' | 'view'

export default function InnovationsPage() {
  const [tab, setTab] = useState<Tab>('submit')

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Innovations</h2>
          <p className="page-subtitle">Submit and browse project innovations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 rounded-xl w-fit">
        <button onClick={() => setTab('submit')}
          className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            tab === 'submit' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700')}>
          <Plus size={15} /> Submit
        </button>
        <button onClick={() => setTab('view')}
          className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            tab === 'view' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700')}>
          <Eye size={15} /> View All
        </button>
      </div>

      {tab === 'submit' && <SubmitTab onSuccess={() => setTab('view')} />}
      {tab === 'view'   && <ViewTab />}
    </div>
  )
}