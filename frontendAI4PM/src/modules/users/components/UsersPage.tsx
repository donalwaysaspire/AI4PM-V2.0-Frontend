import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, UserPlus, RefreshCw, Trash2, X } from 'lucide-react'
import { usersApi } from '@/services/api/users.api'
import { ROLE_LABELS, ROUTES } from '@/constants'
import { formatDateTime, cn, getErrorMessage } from '@/utils'
import type { User } from '@/types'
import toast from 'react-hot-toast'

const ROLE_BADGE: Record<string, string> = {
  admin:            'bg-purple-100 text-purple-700',
  delivery_manager: 'bg-blue-100   text-blue-700',
  primary_manager:  'bg-teal-100   text-teal-700',
  vp:               'bg-indigo-100 text-indigo-700',
  president:        'bg-orange-100 text-orange-700',
  ceo:              'bg-rose-100   text-rose-700',
  viewer:           'bg-surface-100 text-surface-600',
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDeleteDialog({ user, onConfirm, onCancel, isPending }: {
  user: User
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
        <h3 className="text-base font-semibold text-surface-900 mb-1">Delete User</h3>
        <p className="text-sm text-surface-500 mb-6">
          Are you sure you want to delete <strong className="text-surface-800">{user.username}</strong>? This action cannot be undone.
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

export default function UsersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch]             = useState('')
  const [roleFilter, setRoleFilter]     = useState('')
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['users'],
    queryFn:  () => usersApi.getAll().then((r) => r.data.users),
  })

  const { mutate: deleteUser, isPending: deleting } = useMutation({
    mutationFn: (userId: string) => usersApi.delete(userId),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User deleted successfully')
      setDeleteTarget(null)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const users = (data ?? []).filter((u) => {
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole   = roleFilter ? u.role === roleFilter : true
    return matchSearch && matchRole
  })

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">User Management</h2>
          <p className="page-subtitle">Manage system users and permissions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="btn-outline"><RefreshCw size={15} /> Refresh</button>
          <button onClick={() => navigate(ROUTES.USERS_CREATE)} className="btn-primary"><UserPlus size={15} /> Create User</button>
        </div>
      </div>

      <div className="card">
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input placeholder="Search by username or email…" className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input w-44" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All roles</option>
            {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16 text-surface-400 text-sm gap-2">
            <RefreshCw size={16} className="animate-spin" /> Loading users…
          </div>
        )}

        {isError && (
          <div className="text-center py-16 text-danger-500 text-sm">
            Failed to load users. <button onClick={() => refetch()} className="underline">Retry</button>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Projects</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-surface-400 text-sm">No users found</td></tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.user_id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {user.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-surface-900">{user.username}</p>
                            <p className="text-xs text-surface-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={cn('badge', ROLE_BADGE[user.role] ?? 'badge-neutral')}>
                          {ROLE_LABELS[user.role] ?? user.role}
                        </span>
                      </td>
                      <td>
                        {user.project_ids.length === 0
                          ? <span className="text-xs text-surface-400">—</span>
                          : <div className="flex flex-wrap gap-1">{user.project_ids.map((p) => <span key={p} className="badge badge-neutral">{p}</span>)}</div>
                        }
                      </td>
                      <td>
                        <span className={cn('badge', user.is_active ? 'badge-success' : 'badge-danger')}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-surface-500 text-xs whitespace-nowrap">{formatDateTime(user.created_at)}</td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/users/${user.user_id}/edit`, { state: { user } })}
                            className="btn-ghost btn-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(user)}
                            className="btn-sm text-xs px-3 py-1.5 text-danger-500 hover:bg-danger-50 rounded-xl font-medium transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isError && (
          <p className="text-xs text-surface-400 mt-3">Showing {users.length} of {data?.length ?? 0} users</p>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDeleteDialog
          user={deleteTarget}
          onConfirm={() => deleteUser(deleteTarget.user_id)}
          onCancel={() => setDeleteTarget(null)}
          isPending={deleting}
        />
      )}
    </div>
  )
}