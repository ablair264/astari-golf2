import React from 'react'
import { ChevronRight } from 'lucide-react'
import { useDrillDown } from './DrillDownContext'

export function Breadcrumbs({ className = '' }) {
  const { breadcrumbs } = useDrillDown()

  return (
    <div className={`flex items-center gap-2 text-sm text-white/70 truncate ${className}`}>
      {breadcrumbs.map((crumb, idx) => (
        <React.Fragment key={`${crumb.view}-${idx}`}>
          <span className="truncate">{crumb.label}</span>
          {idx < breadcrumbs.length - 1 && <ChevronRight className="w-4 h-4 text-white/40 flex-shrink-0" />}
        </React.Fragment>
      ))}
    </div>
  )
}
