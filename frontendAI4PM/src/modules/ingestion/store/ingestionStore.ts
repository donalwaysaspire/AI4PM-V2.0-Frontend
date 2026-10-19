import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { UploadedFile } from '@/types'

interface IngestionStore {
  files: UploadedFile[]
  uploading: Record<string, number> // fileId -> progress

  // Actions
  setFiles: (files: UploadedFile[]) => void
  addFile: (file: UploadedFile) => void
  updateFileProgress: (id: string, progress: number) => void
  updateFileStatus: (id: string, status: UploadedFile['status'], error?: string) => void
  removeFile: (id: string) => void
  clearUploading: (id: string) => void
}

export const useIngestionStore = create<IngestionStore>()(
  immer((set) => ({
    files: [],
    uploading: {},

    setFiles: (files) =>
      set((state) => { state.files = files }),

    addFile: (file) =>
      set((state) => { state.files.unshift(file) }),

    updateFileProgress: (id, progress) =>
      set((state) => { state.uploading[id] = progress }),

    updateFileStatus: (id, status, error) =>
      set((state) => {
        const file = state.files.find((f) => f.id === id)
        if (file) {
          file.status = status
          if (error) file.error = error
        }
      }),

    removeFile: (id) =>
      set((state) => { state.files = state.files.filter((f) => f.id !== id) }),

    clearUploading: (id) =>
      set((state) => { delete state.uploading[id] }),
  }))
)
