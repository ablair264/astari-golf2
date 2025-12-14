import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Eye } from 'lucide-react';
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

const API_BASE = '/.netlify/functions';

type RuleType = 'default' | 'category' | 'brand' | 'product_type' | 'product_type_category' | 'product_override';

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

interface RuleCreateModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export function RuleCreateModal({ onClose, onCreated }: RuleCreateModalProps) {
  const token = getAuthToken();

  // Form state
  const [name, setName] = useState('');
  const [ruleType, setRuleType] = useState<RuleType>('brand');
  const [marginPercentage, setMarginPercentage] = useState('30');
  const [brand, setBrand] = useState('');
  const [productType, setProductType] = useState('');
  const [category, setCategory] = useState('');
  const [skuCode, setSkuCode] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);

  // Filter options from API
  const [brands, setBrands] = useState<string[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Fetch filter options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch(`${API_BASE}/products-admin/filter-values`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setBrands(data.brands);
          setProductTypes(data.productTypes);
        }
      } catch (err) {
        console.error('Failed to fetch filter options', err);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, [token]);

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
          ruleType,
          productType: productType || null,
          category: category || null,
          brand: brand || null,
          skuCode: skuCode || null,
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

  // Create the rule
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Rule name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`${API_BASE}/margin-rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          ruleType,
          productType: productType || null,
          category: category || null,
          brand: brand || null,
          skuCode: skuCode || null,
          marginPercentage: parseFloat(marginPercentage),
        }),
      });

      const data = await response.json();
      if (data.success) {
        onCreated();
      } else {
        throw new Error(data.error || 'Failed to create rule');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine which fields to show based on rule type
  const showBrandField = ['brand'].includes(ruleType);
  const showProductTypeField = ['product_type', 'product_type_category'].includes(ruleType);
  const showCategoryField = ['category', 'product_type_category'].includes(ruleType);
  const showSkuField = ['product_override'].includes(ruleType);

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
          <h2
            className="text-lg font-semibold text-white"
            style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
          >
            Create Margin Rule
          </h2>
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
              placeholder="e.g., Adidas Premium Margin"
              className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              style={{
                background: colors.bgInput,
                border: `1px solid ${colors.borderMedium}`,
              }}
            />
          </div>

          {/* Rule Type */}
          <div>
            <label
              className="block text-sm text-gray-400 mb-1.5"
              style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
            >
              Rule Type
            </label>
            <select
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value as RuleType)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              style={{
                background: colors.bgInput,
                border: `1px solid ${colors.borderMedium}`,
              }}
            >
              <option value="brand">Brand (Priority 4)</option>
              <option value="product_type">Product Type (Priority 3)</option>
              <option value="product_type_category">Type + Category (Priority 2)</option>
              <option value="category">Category (Priority 5)</option>
              <option value="product_override">Single Product (Priority 1)</option>
            </select>
          </div>

          {/* Conditional Fields */}
          {showBrandField && (
            <div>
              <label
                className="block text-sm text-gray-400 mb-1.5"
                style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
              >
                Brand
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{
                  background: colors.bgInput,
                  border: `1px solid ${colors.borderMedium}`,
                }}
              >
                <option value="">Select brand...</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showProductTypeField && (
            <div>
              <label
                className="block text-sm text-gray-400 mb-1.5"
                style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
              >
                Product Type
              </label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{
                  background: colors.bgInput,
                  border: `1px solid ${colors.borderMedium}`,
                }}
              >
                <option value="">Select product type...</option>
                {productTypes.map((pt) => (
                  <option key={pt} value={pt}>
                    {pt}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showCategoryField && (
            <div>
              <label
                className="block text-sm text-gray-400 mb-1.5"
                style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
              >
                Category (text match)
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Workwear"
                className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{
                  background: colors.bgInput,
                  border: `1px solid ${colors.borderMedium}`,
                }}
              />
            </div>
          )}

          {showSkuField && (
            <div>
              <label
                className="block text-sm text-gray-400 mb-1.5"
                style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
              >
                SKU Code
              </label>
              <input
                type="text"
                value={skuCode}
                onChange={(e) => setSkuCode(e.target.value)}
                placeholder="e.g., ADIDAS-TSH-BLK-M"
                className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{
                  background: colors.bgInput,
                  border: `1px solid ${colors.borderMedium}`,
                }}
              />
            </div>
          )}

          {/* Margin Percentage */}
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
                className="w-full px-3 py-2 pr-10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{
                  background: colors.bgInput,
                  border: `1px solid ${colors.borderMedium}`,
                }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
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
            disabled={isSubmitting || !name.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Rule
          </button>
        </div>
      </div>
    </div>
  );
}

export default RuleCreateModal;
