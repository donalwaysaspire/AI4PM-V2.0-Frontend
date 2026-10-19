import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, User, Mail, Lock, Shield, Briefcase,
  Users, Check, X, ChevronDown, Loader2, AlertCircle, Search, ToggleLeft, Trash2, Plus,
} from 'lucide-react'
import { usersApi, type CreateUserPayload, type UpdateUserPayload } from '@/services/api/users.api'
import { ROUTES, ROLE_LABELS } from '@/constants'
import { getErrorMessage, cn } from '@/utils'
import { useAuthStore } from '@/modules/auth/store/authStore'
import type { User as UserType } from '@/types'
import toast from 'react-hot-toast'

const createSchema = z.object({
  username:    z.string().min(3, 'Username must be at least 3 characters'),
  email:       z.string().email('Enter a valid email address'),
  password:    z.string().min(8, 'Password must be at least 8 characters'),
  role:        z.string().min(1, 'Please select a role'),
  project_ids: z.array(z.string()),
  manager_ids: z.array(z.string()),
  is_active:   z.boolean(),
})

const editSchema = z.object({
  username:    z.string(),
  email:       z.string().email('Enter a valid email address'),
  password:    z.string().optional().refine((v) => !v || v.length >= 8, 'Password must be at least 8 characters'),
  role:        z.string().min(1, 'Please select a role'),
  project_ids: z.array(z.string()),
  manager_ids: z.array(z.string()),
  is_active:   z.boolean(),
})

type FormValues = {
  username:    string
  email:       string
  password?:   string
  role:        string
  project_ids: string[]
  manager_ids: string[]
  is_active:   boolean
}

// ─── Project combobox — type new name OR select existing, Enter to add ─────────
function ProjectMulti({ options, value, onChange, loading, onDeleteProject }: {
  options: string[]; value: string[]; onChange: (v: string[]) => void
  loading?: boolean; onDeleteProject?: (name: string) => void
}) {
  const [input, setInput] = useState('')
  const [open,  setOpen]  = useState(false)

  const filtered = options.filter(
    (o) => !value.includes(o) && o.toLowerCase().includes(input.toLowerCase())
  )
  const canAdd = input.trim().length > 0 && !value.includes(input.trim())

  const add = (name: string) => {
    const trimmed = name.trim()
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed])
    setInput('')
    setOpen(false)
  }

  const remove = (p: string) => onChange(value.filter((v) => v !== p))

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); if (canAdd) add(input) }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div>
      <div className="relative">
        <div className="input flex items-center gap-1 p-0 overflow-hidden">
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder={loading ? 'Loading…' : 'Type or select a project…'}
            className="flex-1 bg-transparent text-sm text-surface-800 placeholder-surface-400 px-3 py-2.5 focus:outline-none min-w-0"
          />
          {input && (
            <button type="button" onMouseDown={(e) => { e.preventDefault(); setInput(''); }}
              className="p-0.5 text-surface-400 hover:text-surface-600"><X size={13} /></button>
          )}
          <ChevronDown size={14}
            className={cn('text-surface-400 transition-transform cursor-pointer mr-2.5', open && 'rotate-180')}
            onMouseDown={(e) => { e.preventDefault(); setOpen((p) => !p) }} />
        </div>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onMouseDown={() => setOpen(false)} />
            <div className="absolute z-20 mt-1 w-full bg-white border border-surface-200 rounded-xl shadow-card-md overflow-hidden">
              <div className="max-h-52 overflow-y-auto">
                {canAdd && (
                  <button type="button" onMouseDown={() => add(input)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-primary-50 border-b border-surface-100 text-left text-primary-600">
                    <Plus size={13} /> Add "<strong>{input.trim()}</strong>" as new project
                  </button>
                )}
                {filtered.length === 0 && !canAdd && (
                  <p className="px-4 py-3 text-sm text-surface-400">
                    {input ? 'Already added or no match — press Enter to add anyway' : 'Type a project name or select below'}
                  </p>
                )}
                {filtered.map((opt) => (
                  <div key={opt} className="flex items-center group hover:bg-surface-50 transition-colors">
                    <button type="button" onMouseDown={() => add(opt)}
                      className="flex-1 px-4 py-2.5 text-sm text-left text-surface-700 hover:text-primary-700">
                      {opt}
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
                Select existing or type a new name · Press Enter to add
              </div>
            </div>
          </>
        )}
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {value.map((p) => (
            <span key={p} className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-lg font-medium">
              {p}
              <button type="button" onClick={() => remove(p)} className="hover:text-primary-900 ml-0.5"><X size={11} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── MultiSelect with search ──────────────────────────────────────────────────
function MultiSelect({ options, value, onChange, placeholder, loading, isError, emptyText, disabled }: {
  options: { value: string; label: string }[]; value: string[]; onChange: (val: string[]) => void
  placeholder: string; loading?: boolean; isError?: boolean; emptyText?: string; disabled?: boolean
}) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  const selectedOptions = options.filter((o) => value.includes(o.value))
  const filtered        = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="relative">
      <button type="button" disabled={disabled} onClick={() => { setOpen((p) => !p); setSearch('') }}
        className={cn('input flex items-center justify-between text-left w-full', disabled && 'opacity-50 cursor-not-allowed')}>
        <span className={cn('truncate pr-2', !selectedOptions.length && 'text-surface-400')}>
          {loading ? 'Loading…' : selectedOptions.length ? `${selectedOptions.length} selected` : placeholder}
        </span>
        <ChevronDown size={15} className={cn('flex-shrink-0 text-surface-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full bg-white border border-surface-200 rounded-xl shadow-card-md overflow-hidden">
            <div className="p-2 border-b border-surface-100">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400" />
                <input autoFocus type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
                  className="w-full pl-7 pr-3 py-1.5 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                  onClick={(e) => e.stopPropagation()} />
              </div>
            </div>
            <div className="max-h-44 overflow-y-auto">
              {loading && <div className="flex items-center gap-2 px-4 py-3 text-sm text-surface-400"><Loader2 size={14} className="animate-spin" /> Loading…</div>}
              {!loading && isError && <div className="flex items-center gap-2 px-4 py-3 text-sm text-danger-500"><AlertCircle size={14} /> Failed to load</div>}
              {!loading && !isError && filtered.length === 0 && <p className="px-4 py-3 text-sm text-surface-400">{search ? `No results for "${search}"` : (emptyText ?? 'No options available')}</p>}
              {!loading && !isError && filtered.map((opt) => (
                <button key={opt.value} type="button" onClick={() => toggle(opt.value)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-surface-50 transition-colors text-left">
                  <span className={value.includes(opt.value) ? 'text-primary-700 font-medium' : 'text-surface-700'}>{opt.label}</span>
                  {value.includes(opt.value) ? <Check size={14} className="text-primary-600 flex-shrink-0" /> : <div className="w-4 h-4 rounded border border-surface-300 flex-shrink-0" />}
                </button>
              ))}
            </div>
            {!loading && !isError && options.length > 0 && (
              <div className="px-4 py-2 border-t border-surface-100 text-xs text-surface-400 flex justify-between">
                <span>{filtered.length} option{filtered.length !== 1 ? 's' : ''}</span>
                {value.length > 0 && <button type="button" onClick={() => onChange([])} className="text-danger-500 hover:underline">Clear all</button>}
              </div>
            )}
          </div>
        </>
      )}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedOptions.map((o) => (
            <span key={o.value} className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-lg font-medium">
              {o.label}<button type="button" onClick={() => toggle(o.value)} className="hover:text-primary-900 ml-0.5"><X size={11} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── SingleSelect ─────────────────────────────────────────────────────────────
function SingleSelect({ options, value, onChange, placeholder, hasError }: {
  options: { value: string; label: string }[]; value: string; onChange: (val: string) => void
  placeholder: string; hasError?: boolean
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((p) => !p)}
        className={cn('input flex items-center justify-between text-left w-full', hasError && 'input-error', !selected && 'text-surface-400')}>
        <span>{selected?.label ?? placeholder}</span>
        <ChevronDown size={15} className={cn('flex-shrink-0 text-surface-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full bg-white border border-surface-200 rounded-xl shadow-card-md max-h-52 overflow-y-auto">
            {options.map((opt) => (
              <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false) }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-surface-50 transition-colors text-left">
                <span className={value === opt.value ? 'text-primary-700 font-medium' : 'text-surface-700'}>{opt.label}</span>
                {value === opt.value && <Check size={14} className="text-primary-600" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CreateUserPage() {
  const navigate    = useNavigate()
  const location    = useLocation()
  const queryClient = useQueryClient()
  const { userId }  = useParams<{ userId: string }>()
  const isEditMode  = !!userId
  const existingUser = location.state?.user as UserType | undefined

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(isEditMode ? editSchema : createSchema) as any,
    defaultValues: { role: '', project_ids: [], manager_ids: [], is_active: true, username: '', email: '', password: '' },
  })

  useEffect(() => {
    if (isEditMode && existingUser) {
      reset({
        username:    existingUser.username    ?? '',
        email:       existingUser.email       ?? '',
        password:    '',
        role:        existingUser.role        ?? '',
        project_ids: existingUser.project_ids ?? [],
        manager_ids: (existingUser as any).manager_ids ?? [],
        is_active:   existingUser.is_active   ?? true,
      })
    }
  }, [isEditMode, existingUser, reset])

  const originalValues: Partial<FormValues> = existingUser ? {
    email: existingUser.email, role: existingUser.role,
    project_ids: existingUser.project_ids,
    manager_ids: (existingUser as any).manager_ids ?? [],
    is_active: existingUser.is_active,
  } : {}

  const selectedRole = useWatch({ control, name: 'role' })

  const { mutate: deleteProject } = useMutation({
    mutationFn: (name: string) => usersApi.deleteProject(name),
    onSuccess:  (_, name) => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success(`Project "${name}" deleted`) },
    onError:    () => toast.error('Failed to delete project'),
  })
  const canDeleteProject = useAuthStore((s) => s.hasPermission)('admin:all')

  const handleDeleteProject = (name: string) => {
    if (!canDeleteProject) return
    if (window.confirm(`Delete project "${name}"? This cannot be undone.`)) deleteProject(name)
  }

  const { data: managersData, isLoading: loadingManagers, isError: managersError } = useQuery({
    queryKey: ['managers', selectedRole],
    queryFn:  () => { if (!selectedRole) return Promise.resolve([]); return usersApi.getManagers(selectedRole).then((r) => r.data.managers) },
    enabled:  !!selectedRole,
  })

  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn:  () => usersApi.getProjects().then((r) => r.data.projects),
  })

  const projectOptions = (projectsData ?? []).map((p) => p.project_name)
  const managerOptions = (managersData ?? []).map((m) => ({ value: m.user_id, label: `${m.username} (${ROLE_LABELS[m.role] ?? m.role})` }))
  const roleOptions    = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))

  const { mutate: createUser, isPending: creating } = useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.create(payload),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('User created!'); navigate(ROUTES.USERS) },
    onError:    (e) => toast.error(getErrorMessage(e)),
  })

  const { mutate: updateUser, isPending: updating } = useMutation({
    mutationFn: (payload: UpdateUserPayload) => usersApi.update(userId!, payload),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('User updated!'); navigate(ROUTES.USERS) },
    onError:    (e) => toast.error(getErrorMessage(e)),
  })

  const isPending = creating || updating

  const onSubmit = (values: FormValues) => {
    if (isEditMode) {
      const payload: UpdateUserPayload = {}
      if (values.email     !== originalValues.email)     payload.email     = values.email
      if (values.role      !== originalValues.role)      payload.role      = values.role
      if (values.is_active !== originalValues.is_active) payload.is_active = values.is_active
      if (JSON.stringify(values.project_ids) !== JSON.stringify(originalValues.project_ids)) payload.project_ids = values.project_ids
      if (JSON.stringify(values.manager_ids) !== JSON.stringify(originalValues.manager_ids)) payload.manager_ids = values.manager_ids
      if (values.password) payload.password = values.password
      if (Object.keys(payload).length === 0) { toast('No changes to save', { icon: 'ℹ️' }); return }
      updateUser(payload)
    } else {
      createUser(values as CreateUserPayload)
    }
  }

  const onInvalid = (errs: typeof errors) => {
    const first = Object.values(errs)[0]?.message
    if (first) toast.error(String(first))
  }

  return (
    <div className="page-container max-w-3xl">
      <div>
        <button onClick={() => navigate(ROUTES.USERS)} className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-800 mb-4 transition-colors">
          <ArrowLeft size={16} /> Back to Users
        </button>
        <h2 className="page-title">{isEditMode ? 'Edit User' : 'Create User'}</h2>
        <p className="page-subtitle">{isEditMode ? `Editing ${existingUser?.username ?? ''}` : 'Add a new user to the system'}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
        <div className="space-y-5">

          <div className="card">
            <h3 className="text-base font-semibold text-surface-800 mb-4 flex items-center gap-2">
              <User size={17} className="text-primary-500" /> Account Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Username {!isEditMode && <span className="text-danger-500">*</span>}</label>
                {isEditMode
                  ? <div className="input bg-surface-50 text-surface-500 cursor-not-allowed select-none">{existingUser?.username}</div>
                  : <><input {...register('username')} placeholder="john.doe" className={cn('input', errors.username && 'input-error')} />
                     {errors.username && <p className="error-text">{errors.username.message}</p>}</>
                }
              </div>
              <div>
                <label className="label">Email Address <span className="text-danger-500">*</span></label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input {...register('email')} type="email" placeholder="john@company.com" className={cn('input pl-9', errors.email && 'input-error')} />
                </div>
                {errors.email && <p className="error-text">{errors.email.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="label">
                  Password {!isEditMode && <span className="text-danger-500">*</span>}
                  {isEditMode && <span className="text-surface-400 font-normal ml-1">(leave blank to keep current)</span>}
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input {...register('password')} type="password"
                    placeholder={isEditMode ? 'Enter new password to reset…' : 'Min. 8 characters'}
                    className={cn('input pl-9', errors.password && 'input-error')} />
                </div>
                {errors.password && <p className="error-text">{errors.password.message as string}</p>}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-base font-semibold text-surface-800 mb-4 flex items-center gap-2">
              <Shield size={17} className="text-primary-500" /> Role & Status
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Role <span className="text-danger-500">*</span></label>
                <Controller name="role" control={control}
                  render={({ field }) => (
                    <SingleSelect options={roleOptions} value={field.value} onChange={field.onChange}
                      placeholder="Select a role…" hasError={!!errors.role} />
                  )} />
                {errors.role && <p className="error-text">{errors.role.message}</p>}
              </div>
              {isEditMode && (
                <div>
                  <label className="label">Account Status</label>
                  <Controller name="is_active" control={control}
                    render={({ field }) => (
                      <button type="button" onClick={() => field.onChange(!field.value)}
                        className={cn('flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all w-full',
                          field.value ? 'border-green-200 bg-green-50 text-green-700' : 'border-surface-200 bg-surface-50 text-surface-500')}>
                        <ToggleLeft size={18} className={field.value ? 'text-green-600' : 'text-surface-400'} />
                        {field.value ? 'Active' : 'Inactive'}
                      </button>
                    )} />
                </div>
              )}
            </div>
            {selectedRole && <p className="text-xs text-surface-400 mt-3">Managers list filtered by: <strong>{ROLE_LABELS[selectedRole] ?? selectedRole}</strong></p>}
          </div>

          <div className="card">
            <h3 className="text-base font-semibold text-surface-800 mb-1 flex items-center gap-2">
              <Briefcase size={17} className="text-primary-500" /> Projects
            </h3>
            <p className="text-xs text-surface-400 mb-3">
              Select an existing project or type a new name and press Enter to add it.
            </p>
            <Controller name="project_ids" control={control}
              render={({ field }) => (
                <ProjectMulti options={projectOptions} value={field.value} onChange={field.onChange}
                  loading={loadingProjects} onDeleteProject={canDeleteProject ? handleDeleteProject : undefined} />
              )} />
          </div>

          <div className="card">
            <h3 className="text-base font-semibold text-surface-800 mb-1 flex items-center gap-2">
              <Users size={17} className="text-primary-500" /> Managers
            </h3>
            <p className="text-xs text-surface-400 mb-4">
              {selectedRole ? <>Showing managers with role: <strong>{ROLE_LABELS[selectedRole] ?? selectedRole}</strong></> : 'Select a role above to load available managers'}
            </p>
            <Controller name="manager_ids" control={control}
              render={({ field }) => (
                <MultiSelect options={managerOptions} value={field.value} onChange={field.onChange}
                  placeholder="Select managers…" loading={loadingManagers} isError={managersError}
                  disabled={!selectedRole}
                  emptyText={selectedRole ? `No managers found for role: ${ROLE_LABELS[selectedRole] ?? selectedRole}` : 'Select a role first'} />
              )} />
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button type="button" onClick={() => navigate(ROUTES.USERS)} className="btn-outline">Cancel</button>
            <button type="submit" disabled={isPending} className="btn-primary px-6">
              {isPending && <Loader2 size={15} className="animate-spin" />}
              {isPending ? (isEditMode ? 'Saving…' : 'Creating…') : (isEditMode ? 'Save Changes' : 'Create User')}
            </button>
          </div>

        </div>
      </form>
    </div>
  )
}