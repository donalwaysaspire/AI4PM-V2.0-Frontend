import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { UserProfile } from '@/types'
import { STORAGE_KEYS } from '@/constants'

interface AuthStore {
  user: UserProfile | null
  accessToken: string | null
  isAuthenticated: boolean

  // Actions
  setToken: (accessToken: string) => void
  setUser: (user: UserProfile) => void
  clearAuth: () => void

  // Permission helper
  hasPermission: (permission: string) => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    immer((set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setToken: (accessToken) => {
        set((state) => {
          state.accessToken = accessToken
          state.isAuthenticated = true
        })
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
      },

      setUser: (user) => {
        set((state) => {
          state.user = user
        })
      },

      clearAuth: () => {
        set((state) => {
          state.user = null
          state.accessToken = null
          state.isAuthenticated = false
        })
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER)
      },

      // Check if logged-in user has a specific permission
      hasPermission: (permission: string) => {
        const { user } = get()
        return user?.permissions?.includes(permission) ?? false
      },
    })),
    {
      name: STORAGE_KEYS.USER,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)