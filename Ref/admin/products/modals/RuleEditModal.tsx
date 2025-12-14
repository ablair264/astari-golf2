import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Eye, Percent } from 'lucide-react';
import { getAuthToken } from '../../../../lib/api';
import { MarginRule } from '../RulesPanel/RulesPanel';

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

const API_BASE = '/.netlify/functions';

interface PreviewData {
  totalAffected: number;
  avgCost: string;
  avgNewPrice: string;
  minNewPrice: string;
  maxNewPrice: string;
  samples: Array<{
    sku_code: string;
    style_name: string;
    brand: string;
    product_type: string;
    single_price: string;
    projected_price: string;
  }>;
}

interface RuleEditModalProps {
  rule: MarginRule;
  onClose: () => void;
  onUpdated: () => void;
}

export function RuleEditModal({ rule, onClose, onUpdated }: RuleEditModalProps) {
  const token = getAuthToken();

  // Form state - initialize with current rule values
  const [name, setName] = useState(rule.name);
  const [marginPercentage, setMarginPercentage] = useState(
    parseFloat(rule.margin_percentage).toString()
  );

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);

  // Check if values have changed
  const hasChanges =
    name !== rule.name ||
    parseFloat(marginPercentage) !== parseFloat(rule.margin_percentage);

  // Preview the rule's impact
  const handlePreview = async () => {
    try {
      setIsPreviewing(true);
      setError(null);

      const response = await fetch(`${API_BASE}/margin-rules/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ruleType: rule.rule_type,
          productType: rule.product_type || null,
          category: rule.category || null,
          brand: rule.brand || null,
          skuCode: rule.sku_code || null,
          marginPercentage: parseFloat(marginPercentage),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPreview(data.preview);
      } else {
        throw new Error(data.error || 'Failed to preview');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setIsPreviewing(false);
    }
  };

  // Update the rule
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Rule name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`${API_BASE}/margin-rules/${rule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          marginPercentage: parseFloat(marginPercentage),
        }),
      });

      const data = await response.json();
      if (data.success) {
        onUpdated();
      } else {
        throw new Error(data.error || 'Failed to update rule');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get description for the rule type
  const getRuleTypeDescription = () => {
    switch (rule.rule_type) {
      case 'default':
        return 'This is the default margin applied to all products that don\'t match any other rule.';
      case 'brand':
        return `Applies to all products from brand: ${rule.brand}`;
      case 'category':
        return `Applies to products in category: ${rule.category}`;
      case 'product_type':
        return `Applies to product type: ${rule.product_type}`;
      case 'product_type_category':
        return `Applies to type "${rule.product_type}" in category "${rule.category}"`;
      case 'product_override':
        return `Applies to specific SKU: ${rule.sku_code}`;
      default:
        return rule.rule_type;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div
        className="w-full max-w-lg rounded-xl overflow-hidden"
        style={{
          background: colors.bgCard,
          border: `1px solid ${colors.borderMedium}`,
        }}
      >
        {/* Header */}
        <div
          className="p-4 flex items-center justify-between border-b"
          style={{ borderColor: colors.borderLight }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Percent className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2
                className="text-lg font-semibold text-white"
                style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
              >
                {rule.rule_type === 'default' ? 'Edit Default Margin' : 'Edit Margin Rule'}
              </h2>
              <p className="text-xs text-gray-500">Priority {rule.priority}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-purple-500/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Error */}
          {error && (
            <div
              className="p-3 rounded-lg flex items-center gap-2"
              style={{ background: 'rgba(239, 68, 68, 0.1)' }}
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-300">{error}</span>
            </div>
          )}

          {/* Rule Type Info */}
          <div
            className="p-3 rounded-lg"
            style={{ background: colors.bgDark }}
          >
            <p className="text-sm text-gray-400">{getRuleTypeDescription()}</p>
          </div>

          {/* Rule Name */}
          <div>
            <label
              className="block text-sm text-gray-400 mb-1.5"
              style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
            >
              Rule Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Default Margin"
              className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              style={{
                background: colors.bgInput,
                border: `1px solid ${colors.borderMedium}`,
              }}
            />
          </div>

          {/* Margin Percentage - Main Focus */}
          <div>
            <label
              className="block text-sm text-gray-400 mb-1.5"
              style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
            >
              Margin Percentage
            </label>
            <div className="relative">
              <input
                type="number"
                value={marginPercentage}
                onChange={(e) => setMarginPercentage(e.target.value)}
                min="0"
                max="200"
                step="0.5"
                className="w-full px-3 py-3 pr-10 rounded-lg text-lg font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{
                  background: colors.bgInput,
                  border: `1px solid ${colors.borderMedium}`,
                }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">%</span>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              Current: {parseFloat(rule.margin_percentage).toFixed(1)}% → New:{' '}
              <span className="text-purple-400 font-medium">
                {parseFloat(marginPercentage || '0').toFixed(1)}%
              </span>
            </p>
          </div>

          {/* Quick Margin Presets */}
          <div>
            <label
              className="block text-sm text-gray-400 mb-1.5"
              style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
            >
              Quick Select
            </label>
            <div className="flex flex-wrap gap-2">
              {[20, 25, 30, 35, 40, 45, 50].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMarginPercentage(preset.toString())}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    parseFloat(marginPercentage) === preset
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>

          {/* Preview Button */}
          <button
            type="button"
            onClick={handlePreview}
            disabled={isPreviewing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-colors disabled:opacity-50"
            style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
          >
            {isPreviewing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">Preview Impact</span>
          </button>

          {/* Preview Results */}
          {preview && (
            <div
              className="p-3 rounded-lg space-y-2"
              style={{ background: colors.bgDark }}
            >
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Products affected: </span>
                  <span className="text-purple-300 font-medium">
                    {preview.totalAffected.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Avg. cost: </span>
                  <span className="text-gray-300">£{preview.avgCost}</span>
                </div>
                <div>
                  <span className="text-gray-500">Avg. new price: </span>
                  <span className="text-purple-300 font-medium">£{preview.avgNewPrice}</span>
                </div>
                <div>
                  <span className="text-gray-500">Price range: </span>
                  <span className="text-gray-300">
                    £{preview.minNewPrice} - £{preview.maxNewPrice}
                  </span>
                </div>
              </div>

              {preview.samples.length > 0 && (
                <div className="mt-2 pt-2 border-t" style={{ borderColor: colors.borderLight }}>
                  <p className="text-xs text-gray-500 mb-1">Sample products:</p>
                  <div className="space-y-1 max-h-[120px] overflow-y-auto">
                    {preview.samples.slice(0, 5).map((sample) => (
                      <div key={sample.sku_code} className="flex justify-between text-xs">
                        <span className="text-gray-400 truncate max-w-[60%]">
                          {sample.style_name}
                        </span>
                        <span className="text-gray-300">
                          £{parseFloat(sample.single_price).toFixed(2)} →{' '}
                          <span className="text-purple-300">
                            £{parseFloat(sample.projected_price).toFixed(2)}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div
          className="p-4 flex items-center justify-end gap-3 border-t"
          style={{ borderColor: colors.borderLight }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-purple-500/10 transition-colors"
            style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim() || !hasChanges}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default RuleEditModal;
