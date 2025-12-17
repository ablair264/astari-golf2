import React from 'react'
import { Tag, Building2, FolderTree, Layers, Hash, Trash2, Edit2, Play, ChevronDown, ChevronUp, Calendar } from 'lucide-react'

const OFFER_TYPE_CONFIG = {
  sku: { icon: Hash, color: 'rose', label: 'SKU' },
  style: { icon: Layers, color: 'rose', label: 'Style' },
  category: { icon: FolderTree, color: 'amber', label: 'Category' },
  brand: { icon: Building2, color: 'amber', label: 'Brand' },
  global: { icon: Tag, color: 'amber', label: 'Global' },
}

export function OfferCard({
  offer,
  onEdit,
  onDelete,
  onApply,
  expanded = false,
  onToggleExpand
}) {
  const offerType = offer.sku ? 'sku' : offer.style_no ? 'style' : offer.category_id ? 'category' : offer.brand_id ? 'brand' : 'global'
  const config = OFFER_TYPE_CONFIG[offerType]
  const Icon = config.icon

  const colorClasses = {
    rose: { bg: 'bg-rose-500/15', border: 'border-rose-500/30', text: 'text-rose-300', icon: 'text-rose-400' },
    amber: { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-300', icon: 'text-amber-400' },
  }[config.color]

  const getTargetLabel = () => {
    if (offer.sku) return `SKU: ${offer.sku}`
    if (offer.style_no) return `Style #${offer.style_no}`
    if (offer.category_name) return offer.category_name
    if (offer.category_id) return `Category #${offer.category_id}`
    if (offer.brand_name) return offer.brand_name
    if (offer.brand_id) return `Brand #${offer.brand_id}`
    return 'All Products'
  }

  const isActive = () => {
    if (!offer.start_date && !offer.end_date) return true
    const now = new Date()
    if (offer.start_date && new Date(offer.start_date) > now) return false
    if (offer.end_date && new Date(offer.end_date) < now) return false
    return true
  }

  const active = isActive()

  return (
    <div
      className={`rounded-xl border ${colorClasses.border} ${colorClasses.bg} transition-all hover:border-opacity-60 ${!active ? 'opacity-60' : ''}`}
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
            <span className="font-semibold text-white truncate">{offer.name}</span>
            <span className={`px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-200 text-xs font-medium`}>
              -{offer.discount_percentage}%
            </span>
            {!active && (
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/50 text-xs">
                Inactive
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs ${colorClasses.text}`}>{config.label}</span>
            <span className="text-white/30">·</span>
            <span className="text-xs text-white/50 truncate">{getTargetLabel()}</span>
          </div>
        </div>

        {/* Affected count */}
        {offer.affected_count !== undefined && (
          <div className="text-right shrink-0">
            <div className="text-sm font-bold text-white">{offer.affected_count}</div>
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
          {/* Description */}
          {offer.description && (
            <p className="text-xs text-white/60 mb-3">{offer.description}</p>
          )}

          {/* Details */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
            <div className="p-2 rounded-lg bg-black/20">
              <div className="text-white/40 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Start
              </div>
              <div className="font-medium text-white">
                {offer.start_date ? new Date(offer.start_date).toLocaleDateString() : 'Immediate'}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-black/20">
              <div className="text-white/40 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                End
              </div>
              <div className="font-medium text-white">
                {offer.end_date ? new Date(offer.end_date).toLocaleDateString() : 'No end date'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onApply?.(offer); }}
              className="flex-1 py-1.5 px-3 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Play className="w-3 h-3" />
              Apply Offer
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(offer); }}
              className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
              title="Edit"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(offer.id); }}
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

export default OfferCard
