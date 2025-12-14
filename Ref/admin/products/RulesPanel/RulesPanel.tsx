import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Percent,
  Tag,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  RefreshCw,
  Layers,
  Building2,
  Package,
  Shirt,
} from 'lucide-react';
import { RuleCard } from './RuleCard';
import { RuleCreateModal } from '../modals/RuleCreateModal';
import { getAuthToken } from '../../../../lib/api';

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
};

// API base URL
const API_BASE = '/.netlify/functions';

export interface MarginRule {
  id: string;
  name: string;
  priority: number;
  rule_type: string;
  product_type: string | null;
  category: string | null;
  brand: string | null;
  sku_code: string | null;
  margin_percentage: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  affected_count?: number;
}

interface RulesPanelProps {
  onClose: () => void;
}

export function RulesPanel({ onClose }: RulesPanelProps) {
  const token = getAuthToken();
  const [rules, setRules] = useState<MarginRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'rules' | 'offers' | null>('rules');

  // Fetch margin rules
  const fetchRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/margin-rules`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch rules');
      }

      const data = await response.json();
      if (data.success) {
        setRules(data.rules);
      } else {
        throw new Error(data.error || 'Failed to fetch rules');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRules();
    }
  }, [token]);

  // Apply all rules to products
  const handleApplyRules = async () => {
    try {
      setIsApplying(true);
      const response = await fetch(`${API_BASE}/margin-rules/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Applied ${data.rulesApplied} rules to ${data.affectedCount} products`);
        fetchRules(); // Refresh to get updated affected counts
      } else {
        throw new Error(data.error || 'Failed to apply rules');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to apply rules');
    } finally {
      setIsApplying(false);
    }
  };

  // Rule type icons
  const getRuleTypeIcon = (ruleType: string) => {
    switch (ruleType) {
      case 'brand':
        return <Building2 className="w-4 h-4" />;
      case 'product_type':
        return <Layers className="w-4 h-4" />;
      case 'product_type_category':
        return <Package className="w-4 h-4" />;
      case 'product_override':
        return <Shirt className="w-4 h-4" />;
      default:
        return <Percent className="w-4 h-4" />;
    }
  };

  // Group rules by priority for display
  const groupedRules = rules.reduce((acc, rule) => {
    const priority = rule.priority;
    if (!acc[priority]) acc[priority] = [];
    acc[priority].push(rule);
    return acc;
  }, {} as Record<number, MarginRule[]>);

  const priorityLabels: Record<number, string> = {
    1: 'Product Overrides',
    2: 'Type + Category',
    3: 'Product Type',
    4: 'Brand',
    5: 'Category',
    6: 'Default',
  };

  return (
    <div
      className="h-full rounded-xl flex flex-col overflow-hidden"
      style={{
        background: colors.bgCard,
        border: `1px solid ${colors.borderLight}`,
      }}
    >
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between border-b"
        style={{ borderColor: colors.borderLight }}
      >
        <h2
          className="text-lg font-semibold text-white"
          style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
        >
          Margin Rules
        </h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-purple-500/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
            style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Rule</span>
          </button>
          <button
            onClick={handleApplyRules}
            disabled={isApplying}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
          >
            {isApplying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">Apply All</span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div
            className="p-4 rounded-lg flex items-center gap-3"
            style={{ background: 'rgba(239, 68, 68, 0.1)' }}
          >
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-300 text-sm">{error}</span>
            <button
              onClick={fetchRules}
              className="ml-auto text-red-300 hover:text-red-200 text-sm underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Rules List by Priority */}
        {!loading && !error && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((priority) => {
              const priorityRules = groupedRules[priority] || [];
              if (priorityRules.length === 0 && priority !== 6) return null;

              return (
                <div key={priority} className="space-y-2">
                  {/* Priority Group Header */}
                  <div
                    className="flex items-center gap-2 px-2 py-1"
                    style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
                  >
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      {priorityLabels[priority]} ({priorityRules.length})
                    </span>
                    <div className="flex-1 h-px bg-purple-500/10" />
                    <span className="text-[10px] text-gray-600">
                      Priority {priority}
                    </span>
                  </div>

                  {/* Rules in this priority */}
                  {priorityRules.map((rule) => (
                    <RuleCard
                      key={rule.id}
                      rule={rule}
                      icon={getRuleTypeIcon(rule.rule_type)}
                      onUpdate={fetchRules}
                    />
                  ))}

                  {/* Empty state for default */}
                  {priorityRules.length === 0 && priority === 6 && (
                    <div
                      className="p-3 rounded-lg text-center text-gray-500 text-sm"
                      style={{ background: colors.bgDark }}
                    >
                      No default rule set
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div
        className="p-4 border-t"
        style={{
          borderColor: colors.borderLight,
          background: colors.bgDark,
        }}
      >
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {rules.filter((r) => r.is_active).length} active rules
          </span>
          <span className="text-gray-500">
            {rules.reduce((sum, r) => sum + (parseInt(String(r.affected_count)) || 0), 0).toLocaleString()} products affected
          </span>
        </div>
      </div>

      {/* Create Rule Modal */}
      {showCreateModal && (
        <RuleCreateModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchRules();
          }}
        />
      )}
    </div>
  );
}

export default RulesPanel;
