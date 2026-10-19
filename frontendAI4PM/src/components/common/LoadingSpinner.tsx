import { Loader2 } from 'lucide-react'
import { cn } from '@/utils'

// ─── Loading Spinner ──────────────────────────────────────────────────────────
interface SpinnerProps {
  size?: number
  className?: string
  fullPage?: boolean
}

export default function LoadingSpinner({ size = 20, className, fullPage }: SpinnerProps) {
  if (fullPage) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    )
  }
  return (
    <Loader2
      size={size}
      className={cn('animate-spin text-primary-500', className)}
    />
  )
}
