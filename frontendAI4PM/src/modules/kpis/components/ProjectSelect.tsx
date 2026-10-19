import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Search, Check } from 'lucide-react'
import { cn } from '@/utils'
import { usersApi } from '@/services/api/users.api'

export default function ProjectSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
