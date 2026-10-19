import { useState, useRef, useCallback } from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/utils'

const POPOVER_HEIGHT = 180 // conservative estimate; real content may be shorter
const POPOVER_MARGIN = 12  // gap between button and popover

export default function KpiInfoButton({ description, whyItMatters }: {
  description:  string
  whyItMatters: string
}) {
  const [open, setOpen]         = useState(false)
  const [above, setAbove]       = useState(false)
  const btnRef                  = useRef<HTMLButtonElement>(null)

  const toggle = useCallback(() => {
    if (!open && btnRef.current) {
      const rect       = btnRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setAbove(spaceBelow < POPOVER_HEIGHT + POPOVER_MARGIN)
    }
    setOpen((o) => !o)
  }, [open])

  return (
    <div className="relative inline-flex">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        title="What is this KPI?"
        className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center transition-colors flex-shrink-0',
          open ? 'bg-primary-100 text-primary-600' : 'text-surface-400 hover:text-primary-600 hover:bg-primary-50'
        )}
      >
        <Info size={13} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className={cn(
              'absolute z-20 left-1/2 -translate-x-1/2 w-72 bg-white border border-surface-200 rounded-xl shadow-card-md p-4 text-left',
              above ? 'bottom-7' : 'top-7'
            )}
          >
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-surface-700 leading-relaxed mb-3">{description}</p>
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1">Why it matters</p>
            <p className="text-sm text-surface-700 leading-relaxed">{whyItMatters}</p>
          </div>
        </>
      )}
    </div>
  )
}
