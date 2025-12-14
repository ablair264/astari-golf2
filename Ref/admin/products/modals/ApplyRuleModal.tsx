import React, { useState, useEffect } from 'react';
import { X, Calculator, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { getAuthToken } from '../../../../lib/api';

const colors = {
  bgDark: '#1a1625',
  bgCard: '#2a2440',
  bgInput: '#1e1a2e',
  purple400: '#a78bfa',
  purple500: '#8b5cf6',
  purple600: '#7c3aed',
  borderLight: 'rgba(139, 92, 246, 0.1)',
  borderMedium: 'rgba(139, 92, 246, 0.2)',
};

const API_BASE = '/.netlify/functions';

interface MarginRule {
  id: string;
  name: string;
  rule_type: string;
  brand: string | null;
  product_type: string | null;
  category: string | null;
  style_code: string | null;
  sku_code: string | null;
  margin_percentage: string;
  priority: number;
  is_active: boolean;
}

interface ApplyRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSkus: string[];
  onSuccess: () => void;
}

export function ApplyRuleModal({ isOpen, onClose, selectedSkus, onSuccess }: ApplyRuleModalProps) {
  const token = getAuthToken();
  const [rules, setRules] = useState<MarginRule[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [customMargin, setCustomMargin] = useState<string>('');
  const [useCustomMargin, setUseCustomMargin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingRules, setLoadingRules] = useState(true);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch available rules
  useEffect(() => {
    const fetchRules = async () => {
      try {
        setLoadingRules(true);
        const response = await fetch(`${API_BASE}/margin-rules`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (result.success) {
          setRules(result.rules.filter((r: MarginRule) => r.is_active));
        }
      } catch (err) {
        setError('Failed to load rules');
      } finally {
        setLoadingRules(false);
      }
    };

    if (isOpen) {
      fetchRules();
      setSelectedRuleId('');
      setCustomMargin('');
      setUseCustomMargin(false);
      setPreview(null);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, token]);

  // Get margin percentage from selected rule or custom input
  const getMarginPercentage = (): number | null => {
    if (useCustomMargin) {
      const value = parseFloat(customMargin);
      return isNaN(value) ? null : value;
    } else if (selectedRuleId) {
      const selectedRule = rules.find(r => r.id === selectedRuleId);
      return selectedRule ? parseFloat(selectedRule.margin_percentage) : null;
    }
    return null;
  };

  // Preview impact - just show confirmation since backend doesn't support preview
  const handlePreview = () => {
    const margin = getMarginPercentage();
    if (margin === null) return;

    // Show preview info based on selected options
    setPreview({
      productsAffected: selectedSkus.length,
      marginPercentage: margin,
    });
  };

  // Apply rule
  const handleApply = async () => {
    const marginPercentage = getMarginPercentage();
    if (marginPercentage === null) {
      setError('Please select a rule or enter a custom margin');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/products-admin/bulk/margin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skuCodes: selectedSkus, marginPercentage }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(result.error || 'Failed to apply');
      }
    } catch (err) {
      setError('Failed to apply changes');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-xl shadow-2xl"
        style={{ background: colors.bgCard, border: `1px solid ${colors.borderMedium}` }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${colors.borderLight}` }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Calculator className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Apply Margin</h2>
              <p className="text-sm text-gray-400">{selectedSkus.length} products selected</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="p-4 rounded-full bg-green-500/20">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-green-400 font-medium">Margin applied successfully!</p>
            </div>
          ) : (
            <>
              {/* Mode selection */}
              <div className="flex gap-4">
                <button
                  onClick={() => setUseCustomMargin(false)}
                  className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                    !useCustomMargin
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                      : 'border-gray-600 text-gray-400 hover:border-purple-400'
                  }`}
                >
                  Use Existing Rule
                </button>
                <button
                  onClick={() => setUseCustomMargin(true)}
                  className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                    useCustomMargin
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                      : 'border-gray-600 text-gray-400 hover:border-purple-400'
                  }`}
                >
                  Custom Margin
                </button>
              </div>

              {/* Rule or custom margin input */}
              {useCustomMargin ? (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Margin Percentage
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={customMargin}
                      onChange={(e) => setCustomMargin(e.target.value)}
                      placeholder="e.g., 35"
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full px-4 py-3 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      style={{ background: colors.bgInput, border: `1px solid ${colors.borderLight}` }}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>
              ) : loadingRules ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Select Rule</label>
                  <select
                    value={selectedRuleId}
                    onChange={(e) => setSelectedRuleId(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{ background: colors.bgInput, border: `1px solid ${colors.borderLight}` }}
                  >
                    <option value="">Choose a rule...</option>
                    {rules.map((rule) => (
                      <option key={rule.id} value={rule.id}>
                        {rule.name} ({rule.margin_percentage}%)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Preview */}
              {preview && (
                <div
                  className="p-4 rounded-lg"
                  style={{ background: colors.bgInput, border: `1px solid ${colors.borderLight}` }}
                >
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Confirm Changes</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Products Affected</p>
                      <p className="text-lg text-white">{preview.productsAffected}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">New Margin</p>
                      <p className="text-lg text-white">{preview.marginPercentage}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400">{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div
            className="flex items-center justify-end gap-3 px-6 py-4"
            style={{ borderTop: `1px solid ${colors.borderLight}` }}
          >
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
            >
              Cancel
            </button>
            {!preview ? (
              <button
                onClick={handlePreview}
                disabled={loading || (!selectedRuleId && !customMargin)}
                className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Preview Impact
              </button>
            ) : (
              <button
                onClick={handleApply}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Apply to {selectedSkus.length} Products
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ApplyRuleModal;
