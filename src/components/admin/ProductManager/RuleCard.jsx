import React from 'react'
import { Percent, Building2, FolderTree, Layers, Tag, Trash2, Edit2, Play, ChevronDown, ChevronUp } from 'lucide-react'

const RULE_TYPE_CONFIG = {
  sku: { icon: Tag, color: 'emerald', label: 'SKU', priority: 1 },
  style: { icon: Layers, color: 'blue', label: 'Style', priority: 2 },
  category: { icon: FolderTree, color: 'amber', label: 'Category', priority: 3 },
  brand: { icon: Building2, color: 'teal', label: 'Brand', priority: 4 },
  default: { icon: Percent, color: 'gray', label: 'Default', priority: 5 },
}

export function RuleCard({
  rule,
  onEdit,
  onDelete,
  onApply,
  expanded = false,
  onToggleExpand
}) {
  const ruleType = rule.sku ? 'sku' : rule.style_no ? 'style' : rule.category_id ? 'category' : rule.brand_id ? 'brand' : 'default'
  const config = RULE_TYPE_CONFIG[ruleType]
  const Icon = config.icon
  const colorClasses = {
    emerald: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-300', icon: 'text-emerald-400' },
    blue: { bg: 'bg-blue-500/15', border: 'border-blue-500/30', text: 'text-blue-300', icon: 'text-blue-400' },
    amber: { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-300', icon: 'text-amber-400' },
    teal: { bg: 'bg-teal-500/15', border: 'border-teal-500/30', text: 'text-teal-300', icon: 'text-teal-400' },
    gray: { bg: 'bg-white/10', border: 'border-white/20', text: 'text-white/70', icon: 'text-white/50' },
  }[config.color]

  const getTargetLabel = () => {
    if (rule.sku) return `SKU: ${rule.sku}`
    if (rule.style_no) return `Style #${rule.style_no}`
    if (rule.category_name) return rule.category_name
    if (rule.category_id) return `Category #${rule.category_id}`
    if (rule.brand_name) return rule.brand_name
    if (rule.brand_id) return `Brand #${rule.brand_id}`
    return 'All Products'
  }

  return (
    <div
      className={`rounded-xl border ${colorClasses.border} ${colorClasses.bg} transition-all hover:border-opacity-60`}
    >
      {/* Header - always visible */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => onToggleExpand?.(!expanded)}
      >
        {/* Icon */}
        <div className={`w-9 h-9 rounded-lg ${colorClasses.bg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${colorClasses.icon}`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white truncate">{rule.name}</span>
            <span className={`px-2 py-0.5 rounded-full ${colorClasses.bg} ${colorClasses.text} text-xs font-medium`}>
              +{rule.margin_percentage}%
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs ${colorClasses.text}`}>{config.label}</span>
            <span className="text-white/30">·</span>
            <span className="text-xs text-white/50 truncate">{getTargetLabel()}</span>
          </div>
        </div>

        {/* Affected count */}
        {rule.affected_count !== undefined && (
          <div className="text-right shrink-0">
            <div className="text-sm font-bold text-white">{rule.affected_count}</div>
            <div className="text-[10px] text-white/40 uppercase">products</div>
          </div>
        )}

        {/* Expand toggle */}
        <button className="p-1 text-white/40 hover:text-white/70">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-white/5">
          {/* Details */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
            <div className="p-2 rounded-lg bg-black/20">
              <div className="text-white/40">Priority</div>
              <div className="font-medium text-white">{config.priority}</div>
            </div>
            <div className="p-2 rounded-lg bg-black/20">
              <div className="text-white/40">Created</div>
              <div className="font-medium text-white">
                {rule.created_at ? new Date(rule.created_at).toLocaleDateString() : '—'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onApply?.(rule); }}
              className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Play className="w-3 h-3" />
              Apply Rule
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(rule); }}
              className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
              title="Edit"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(rule.id); }}
              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RuleCard
