import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type Theme = 'light' | 'dark'

interface UIStore {
  theme: Theme
  sidebarCollapsed: boolean
  globalLoading: boolean

  // Actions
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  setGlobalLoading: (v: boolean) => void
}

export const useUIStore = create<UIStore>()(
  immer((set) => ({
    theme: 'light',
    sidebarCollapsed: false,
    globalLoading: false,

    toggleTheme: () =>
      set((state) => { state.theme = state.theme === 'light' ? 'dark' : 'light' }),

    setTheme: (theme) =>
      set((state) => { state.theme = theme }),

    toggleSidebar: () =>
      set((state) => { state.sidebarCollapsed = !state.sidebarCollapsed }),

    setSidebarCollapsed: (v) =>
      set((state) => { state.sidebarCollapsed = v }),

    setGlobalLoading: (v) =>
      set((state) => { state.globalLoading = v }),
  }))
)
