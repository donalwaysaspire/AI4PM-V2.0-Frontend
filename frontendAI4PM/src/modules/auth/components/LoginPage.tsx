import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, User, Loader2, AlertCircle, Shield } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import type { LoginCredentials } from '@/types'
import { APP_NAME } from '@/constants'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  const { login, loading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (credentials: LoginCredentials) => {
    setAuthError('')
    try {
      await login(credentials)
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? err?.response?.data?.message ?? 'Invalid username or password'
      setAuthError(msg)
    }
  }

  const handleEntraLogin = () => {
    // Redirect to backend-initiated OIDC login endpoint
    // The backend handles the Entra code exchange; redirect back to this page
    const loginUrl = import.meta.env.VITE_ENTRA_LOGIN_URL
      ? `${import.meta.env.VITE_ENTRA_LOGIN_URL}`
      : `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/'}auth/oidc/login`
    window.location.href = loginUrl
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-surface-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4 shadow-card-md">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <h1 className="text-2xl font-bold text-surface-900">{APP_NAME}</h1>
          <p className="text-surface-500 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="card shadow-card-lg">
          <div className="space-y-5">
            {/* Entra (Azure AD) sign-in */}
            <button
              type="button"
              onClick={handleEntraLogin}
              disabled={loading}
              className="btn-secondary w-full py-2.5 flex items-center justify-center gap-2.5 disabled:opacity-60"
            >
              <Shield size={16} className="flex-shrink-0" />
              Sign in with Entra ID
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-surface-200" />
              <span className="text-xs uppercase tracking-wide text-surface-400">or</span>
              <div className="h-px flex-1 bg-surface-200" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

              {/* Auth error banner */}
              {authError && (
                <div className="flex items-center gap-2.5 px-3 py-2.5 bg-danger-50 border border-danger-200 rounded-xl text-sm text-danger-700">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  {authError}
                </div>
              )}
              {/* Username */}
              <div>
                <label className="label">Username</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input
                    {...register('username')}
                    type="text"
                    placeholder="your.username"
                    className={`input pl-9 ${errors.username ? 'input-error' : ''}`}
                    autoComplete="username"
                  />
                </div>
                {errors.username && <p className="error-text">{errors.username.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`input pl-9 pr-10 ${errors.password ? 'input-error' : ''}`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="error-text">{errors.password.message}</p>}
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-surface-400 mt-6">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </div>
    </div>
  )
}