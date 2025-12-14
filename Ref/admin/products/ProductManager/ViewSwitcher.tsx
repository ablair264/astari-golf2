import React from 'react';
import { Building2, Layers, Shirt, Grid3X3 } from 'lucide-react';
import { useDrillDown } from './DrillDownContext';

// Admin purple theme colors
const colors = {
  bgDark: '#1a1625',
  bgCard: '#2a2440',
  bgCardHover: '#3d3456',
  bgInput: '#1e1a2e',
  purple400: '#a78bfa',
  purple500: '#8b5cf6',
  purple600: '#7c3aed',
  borderLight: 'rgba(139, 92, 246, 0.1)',
  borderMedium: 'rgba(139, 92, 246, 0.2)',
  borderActive: 'rgba(139, 92, 246, 0.5)',
};

const viewModes = [
  {
    id: 'by-brand' as const,
    label: 'By Brand',
    icon: Building2,
    description: 'Brand → Types → Styles → SKUs',
  },
  {
    id: 'by-type' as const,
    label: 'By Type',
    icon: Layers,
    description: 'Type → Styles → SKUs',
  },
  {
    id: 'by-style' as const,
    label: 'By Style',
    icon: Shirt,
    description: 'Style → SKUs',
  },
  {
    id: 'all' as const,
    label: 'All Products',
    icon: Grid3X3,
    description: 'Flat list of all SKUs',
  },
];

interface ViewSwitcherProps {
  className?: string;
}

export function ViewSwitcher({ className = '' }: ViewSwitcherProps) {
  const { viewMode, setViewMode } = useDrillDown();

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {viewModes.map((mode) => {
        const Icon = mode.icon;
        const isActive = viewMode === mode.id;

        return (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            className={`
              group flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200
              ${isActive
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-lg shadow-purple-500/10'
                : 'bg-[#2a2440] text-gray-400 border border-transparent hover:bg-[#3d3456] hover:text-gray-200 hover:border-purple-500/20'
              }
            `}
            style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
            title={mode.description}
          >
            <Icon
              className={`w-4 h-4 transition-colors ${
                isActive ? 'text-purple-400' : 'text-gray-500 group-hover:text-purple-400'
              }`}
            />
            <span className="text-sm font-medium">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Compact version for mobile or smaller spaces
export function ViewSwitcherCompact({ className = '' }: ViewSwitcherProps) {
  const { viewMode, setViewMode } = useDrillDown();

  return (
    <div
      className={`inline-flex rounded-lg border border-purple-500/20 overflow-hidden ${className}`}
      style={{ background: colors.bgCard }}
    >
      {viewModes.map((mode, index) => {
        const Icon = mode.icon;
        const isActive = viewMode === mode.id;

        return (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            className={`
              p-2.5 transition-all duration-200
              ${index > 0 ? 'border-l border-purple-500/20' : ''}
              ${isActive
                ? 'bg-purple-500/30 text-purple-300'
                : 'text-gray-500 hover:text-purple-300 hover:bg-purple-500/10'
              }
            `}
            title={`${mode.label}: ${mode.description}`}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}

export default ViewSwitcher;
