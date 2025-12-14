import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useDrillDown } from './DrillDownContext';

interface BreadcrumbsProps {
  className?: string;
}

export function Breadcrumbs({ className = '' }: BreadcrumbsProps) {
  const { breadcrumbs, navigateToBreadcrumb, resetNavigation } = useDrillDown();

  return (
    <nav
      className={`flex items-center flex-wrap gap-1 text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      {/* Home/Reset button */}
      <button
        onClick={resetNavigation}
        className="p-1.5 rounded-md text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
        title="Reset to start"
      >
        <Home className="w-4 h-4" />
      </button>

      {breadcrumbs.map((entry, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <React.Fragment key={`${entry.view}-${index}`}>
            <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />

            {isLast ? (
              // Current page (not clickable)
              <span
                className="px-2 py-1 text-purple-300 font-medium truncate max-w-[200px]"
                style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
                title={entry.label}
              >
                {entry.label}
              </span>
            ) : (
              // Clickable breadcrumb
              <button
                onClick={() => navigateToBreadcrumb(index)}
                className="px-2 py-1 rounded-md text-gray-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors truncate max-w-[150px]"
                style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
                title={entry.label}
              >
                {entry.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// Compact version showing only the last 2-3 items
export function BreadcrumbsCompact({ className = '' }: BreadcrumbsProps) {
  const { breadcrumbs, navigateToBreadcrumb, navigateBack } = useDrillDown();

  const visibleCount = 3;
  const startIndex = Math.max(0, breadcrumbs.length - visibleCount);
  const visibleBreadcrumbs = breadcrumbs.slice(startIndex);
  const hasHidden = startIndex > 0;

  return (
    <nav
      className={`flex items-center gap-1 text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      {hasHidden && (
        <>
          <button
            onClick={() => navigateToBreadcrumb(0)}
            className="px-2 py-1 rounded-md text-gray-500 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
            title="Go to beginning"
          >
            ...
          </button>
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </>
      )}

      {visibleBreadcrumbs.map((entry, localIndex) => {
        const actualIndex = startIndex + localIndex;
        const isLast = actualIndex === breadcrumbs.length - 1;

        return (
          <React.Fragment key={`${entry.view}-${actualIndex}`}>
            {localIndex > 0 && (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}

            {isLast ? (
              <span
                className="px-2 py-1 text-purple-300 font-medium truncate max-w-[150px]"
                style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
                title={entry.label}
              >
                {entry.label}
              </span>
            ) : (
              <button
                onClick={() => navigateToBreadcrumb(actualIndex)}
                className="px-2 py-1 rounded-md text-gray-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors truncate max-w-[120px]"
                style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
                title={entry.label}
              >
                {entry.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
