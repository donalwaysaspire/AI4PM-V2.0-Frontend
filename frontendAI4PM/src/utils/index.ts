import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ─── Tailwind class merge ─────────────────────────────────────────────────────
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

// ─── ID generation — Math.random based, works on HTTP and HTTPS ──────────────
export const uuid = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })

export const generateId = uuid

// ─── Date helpers ─────────────────────────────────────────────────────────────
export const formatDate = (date: string | Date, locale = 'en-US') =>
  new Date(date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })

export const formatDateTime = (date: string | Date, locale = 'en-US') =>
  new Date(date).toLocaleString(locale, {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

export const timeAgo = (date: string | Date): string => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  const intervals: [number, string][] = [
    [31536000, 'year'], [2592000, 'month'], [86400, 'day'],
    [3600, 'hour'], [60, 'minute'], [1, 'second'],
  ]
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs)
    if (count >= 1) return `${count} ${label}${count !== 1 ? 's' : ''} ago`
  }
  return 'just now'
}

// ─── String helpers ───────────────────────────────────────────────────────────
export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()

export const truncate = (str: string, max = 50) =>
  str.length > max ? `${str.slice(0, max)}…` : str

export const initials = (name: string) =>
  name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

// ─── File helpers ─────────────────────────────────────────────────────────────
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// ─── Number helpers ───────────────────────────────────────────────────────────
export const formatNumber = (n: number, locale = 'en-US') =>
  new Intl.NumberFormat(locale).format(n)

// ─── Async helpers ────────────────────────────────────────────────────────────
export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

// ─── Error helpers ────────────────────────────────────────────────────────────
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  const data = (error as any)?.response?.data
  if (data?.detail)  return data.detail
  if (data?.message) return data.message
  return 'An unexpected error occurred'
}