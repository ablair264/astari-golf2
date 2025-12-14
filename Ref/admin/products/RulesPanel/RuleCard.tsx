import React, { useState } from 'react';
import {
  Percent,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from 'lucide-react';
import { MarginRule } from './RulesPanel';
import { getAuthToken } from '../../../../lib/api';
import { RuleEditModal } from '../modals/RuleEditModal';

// Admin purple theme colors
const colors = {
  bgDark: '#1a1625',
  bgCard: '#2a2440',
  bgCardHover: '#3d3456',
  purple400: '#a78bfa',
  purple500: '#8b5cf6',
  borderLight: 'rgba(139, 92, 246, 0.1)',
  borderMedium: 'rgba(139, 92, 246, 0.2)',
};

const API_BASE = '/.netlify/functions';

interface RuleCardProps {
  rule: MarginRule;
  icon: React.ReactNode;
  onUpdate: () => void;
}

export function RuleCard({ rule, icon, onUpdate }: RuleCardProps) {
  const token = getAuthToken();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Format the rule description
  const getRuleDescription = () => {
    switch (rule.rule_type) {
      case 'default':
        return 'Applies to all products';
      case 'brand':
        return `Brand: ${rule.brand}`;
      case 'category':
        return `Category: ${rule.category}`;
      case 'product_type':
        return `Type: ${rule.product_type}`;
      case 'product_type_category':
        return `Type: ${rule.product_type} + Category: ${rule.category}`;
      case 'product_override':
        return `SKU: ${rule.sku_code}`;
      default:
        return rule.rule_type;
    }
  };

  // Toggle rule active status
  const handleToggleActive = async () => {
    try {
      setIsToggling(true);
      const response = await fetch(`${API_BASE}/margin-rules/${rule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !rule.is_active }),
      });

      const data = await response.json();
      if (data.success) {
        onUpdate();
      } else {
        throw new Error(data.error || 'Failed to update rule');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update rule');
    } finally {
      setIsToggling(false);
    }
  };

  // Delete rule
  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to deactivate "${rule.name}"?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`${API_BASE}/margin-rules/${rule.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        onUpdate();
      } else {
        throw new Error(data.error || 'Failed to delete rule');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete rule');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={`rounded-lg transition-all ${
        rule.is_active
          ? 'opacity-100'
          : 'opacity-50'
      }`}
      style={{
        background: colors.bgDark,
        border: `1px solid ${colors.borderLight}`,
      }}
    >
      {/* Main Row */}
      <div className="p-3 flex items-center gap-3">
        {/* Icon */}
        <div
          className={`p-2 rounded-lg ${
            rule.is_active ? 'text-purple-400 bg-purple-500/20' : 'text-gray-500 bg-gray-500/10'
          }`}
        >
          {icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4
              className="text-sm font-medium text-white truncate"
              style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
            >
              {rule.name}
            </h4>
            {!rule.is_active && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400">
                Inactive
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">{getRuleDescription()}</p>
        </div>

        {/* Margin Badge */}
        <div
          className="px-3 py-1.5 rounded-lg flex items-center gap-1.5"
          style={{ background: 'rgba(139, 92, 246, 0.15)' }}
        >
          <Percent className="w-3 h-3 text-purple-400" />
          <span
            className="text-sm font-semibold text-purple-300"
            style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
          >
            {parseFloat(rule.margin_percentage).toFixed(0)}%
          </span>
        </div>

        {/* Expand Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div
          className="px-3 pb-3 pt-0 border-t"
          style={{ borderColor: colors.borderLight }}
        >
          <div className="pt-3 space-y-3">
            {/* Stats */}
            <div className="flex gap-4 text-xs">
              <div>
                <span className="text-gray-500">Affected: </span>
                <span className="text-gray-300">
                  {(rule.affected_count || 0).toLocaleString()} products
                </span>
              </div>
              <div>
                <span className="text-gray-500">Priority: </span>
                <span className="text-gray-300">{rule.priority}</span>
              </div>
            </div>

            {/* Rule Details */}
            {rule.brand && (
              <div className="text-xs">
                <span className="text-gray-500">Brand: </span>
                <span className="text-gray-300">{rule.brand}</span>
              </div>
            )}
            {rule.product_type && (
              <div className="text-xs">
                <span className="text-gray-500">Product Type: </span>
                <span className="text-gray-300">{rule.product_type}</span>
              </div>
            )}
            {rule.category && (
              <div className="text-xs">
                <span className="text-gray-500">Category: </span>
                <span className="text-gray-300">{rule.category}</span>
              </div>
            )}
            {rule.sku_code && (
              <div className="text-xs">
                <span className="text-gray-500">SKU: </span>
                <span className="text-gray-300 font-mono">{rule.sku_code}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              {/* Toggle Active */}
              <button
                onClick={handleToggleActive}
                disabled={isToggling || rule.rule_type === 'default'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  rule.is_active
                    ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                    : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isToggling ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : rule.is_active ? (
                  <ToggleRight className="w-3 h-3" />
                ) : (
                  <ToggleLeft className="w-3 h-3" />
                )}
                {rule.is_active ? 'Active' : 'Inactive'}
              </button>

              {/* Edit */}
              <button
                onClick={() => setShowEditModal(true)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
                title="Edit rule"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              {/* Delete */}
              {rule.rule_type !== 'default' && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  title="Delete rule"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <RuleEditModal
          rule={rule}
          onClose={() => setShowEditModal(false)}
          onUpdated={() => {
            setShowEditModal(false);
            onUpdate();
          }}
        />
      )}
    </div>
  );
}

export default RuleCard;
