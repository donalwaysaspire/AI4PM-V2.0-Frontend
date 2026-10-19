import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { ChatMessage, ChatSession } from '@/types'

interface ChatStore {
  sessions: ChatSession[]
  activeSessionId: string | null
  isTyping: boolean

  // Computed
  activeSession: (state: ChatStore) => ChatSession | null

  // Actions
  setSessions: (sessions: ChatSession[]) => void
  addSession: (session: ChatSession) => void
  setActiveSession: (id: string | null) => void
  addMessage: (sessionId: string, message: ChatMessage) => void
  updateLastMessage: (sessionId: string, content: string, isStreaming: boolean) => void
  setTyping: (v: boolean) => void
  removeSession: (id: string) => void
}

export const useChatStore = create<ChatStore>()(
  immer((set, get) => ({
    sessions: [],
    activeSessionId: null,
    isTyping: false,

    activeSession: (state) =>
      state.sessions.find((s) => s.id === state.activeSessionId) ?? null,

    setSessions: (sessions) =>
      set((state) => { state.sessions = sessions }),

    addSession: (session) =>
      set((state) => { state.sessions.unshift(session) }),

    setActiveSession: (id) =>
      set((state) => { state.activeSessionId = id }),

    addMessage: (sessionId, message) =>
      set((state) => {
        const session = state.sessions.find((s) => s.id === sessionId)
        if (session) session.messages.push(message)
      }),

    updateLastMessage: (sessionId, content, isStreaming) =>
      set((state) => {
        const session = state.sessions.find((s) => s.id === sessionId)
        if (session && session.messages.length > 0) {
          const last = session.messages[session.messages.length - 1]
          last.content = content
          last.isStreaming = isStreaming
        }
      }),

    setTyping: (v) =>
      set((state) => { state.isTyping = v }),

    removeSession: (id) =>
      set((state) => {
        state.sessions = state.sessions.filter((s) => s.id !== id)
        if (state.activeSessionId === id) {
          state.activeSessionId = state.sessions[0]?.id ?? null
        }
      }),
  }))
)
