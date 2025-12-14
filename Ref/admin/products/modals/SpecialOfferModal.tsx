import React, { useState, useEffect } from 'react';
import { X, Tag, Loader2, AlertCircle, CheckCircle, Calendar, Plus } from 'lucide-react';
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

interface SpecialOffer {
  id: string;
  name: string;
  discount_percentage: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

interface SpecialOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSkus: string[];
  onSuccess: () => void;
}

export function SpecialOfferModal({ isOpen, onClose, selectedSkus, onSuccess }: SpecialOfferModalProps) {
  const token = getAuthToken();
  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string>('');
  const [createNew, setCreateNew] = useState(false);
  const [newOfferName, setNewOfferName] = useState('');
  const [newOfferDiscount, setNewOfferDiscount] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [removeOffer, setRemoveOffer] = useState(false);

  // Fetch available offers
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoadingOffers(true);
        const response = await fetch(`${API_BASE}/special-offers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (result.success) {
          setOffers(result.offers.filter((o: SpecialOffer) => o.is_active));
        }
      } catch (err) {
        setError('Failed to load offers');
      } finally {
        setLoadingOffers(false);
      }
    };

    if (isOpen) {
      fetchOffers();
      setSelectedOfferId('');
      setCreateNew(false);
      setNewOfferName('');
      setNewOfferDiscount('');
      setPreview(null);
      setError(null);
      setSuccess(false);
      setRemoveOffer(false);
    }
  }, [isOpen, token]);

  // Preview impact
  const handlePreview = async () => {
    if (removeOffer) {
      // Preview removing special offer
      setPreview({
        productsAffected: selectedSkus.length,
        avgPriceChange: 0,
        action: 'remove'
      });
      return;
    }

    if (!selectedOfferId && !createNew) return;
    if (createNew && (!newOfferName || !newOfferDiscount)) return;

    try {
      setLoading(true);
      setError(null);

      const body = createNew
        ? {
            skuCodes: selectedSkus,
            newOffer: {
              name: newOfferName,
              discountPercentage: parseFloat(newOfferDiscount),
            },
            preview: true,
          }
        : {
            skuCodes: selectedSkus,
            offerId: selectedOfferId,
            preview: true,
          };

      const response = await fetch(`${API_BASE}/products-admin/bulk/special-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (result.success) {
        setPreview({ ...result.preview, action: 'apply' });
      } else {
        setError(result.error || 'Failed to preview');
      }
    } catch (err) {
      setError('Failed to preview changes');
    } finally {
      setLoading(false);
    }
  };

  // Apply offer
  const handleApply = async () => {
    try {
      setLoading(true);
      setError(null);

      if (removeOffer) {
        // Remove special offer from selected products
        const response = await fetch(`${API_BASE}/products-admin/bulk/special-offer`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ skuCodes: selectedSkus }),
        });

        const result = await response.json();
        if (result.success) {
          setSuccess(true);
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        } else {
          setError(result.error || 'Failed to remove offer');
        }
        return;
      }

      if (!selectedOfferId && !createNew) return;
      if (createNew && (!newOfferName || !newOfferDiscount)) return;

      const body = createNew
        ? {
            skuCodes: selectedSkus,
            newOffer: {
              name: newOfferName,
              discountPercentage: parseFloat(newOfferDiscount),
            },
          }
        : {
            skuCodes: selectedSkus,
            offerId: selectedOfferId,
          };

      const response = await fetch(`${API_BASE}/products-admin/bulk/special-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(result.error || 'Failed to apply offer');
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
            <div className="p-2 rounded-lg bg-green-500/20">
              <Tag className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Special Offer</h2>
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
              <p className="text-green-400 font-medium">
                {removeOffer ? 'Special offer removed!' : 'Special offer applied!'}
              </p>
            </div>
          ) : (
            <>
              {/* Mode selection */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setCreateNew(false); setRemoveOffer(false); }}
                  className={`flex-1 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                    !createNew && !removeOffer
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                      : 'border-gray-600 text-gray-400 hover:border-purple-400'
                  }`}
                >
                  Existing Offer
                </button>
                <button
                  onClick={() => { setCreateNew(true); setRemoveOffer(false); }}
                  className={`flex-1 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                    createNew
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                      : 'border-gray-600 text-gray-400 hover:border-purple-400'
                  }`}
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  New Offer
                </button>
                <button
                  onClick={() => { setCreateNew(false); setRemoveOffer(true); setPreview(null); }}
                  className={`flex-1 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                    removeOffer
                      ? 'bg-red-500/20 border-red-500 text-red-300'
                      : 'border-gray-600 text-gray-400 hover:border-red-400'
                  }`}
                >
                  Remove
                </button>
              </div>

              {/* Content based on mode */}
              {removeOffer ? (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-300">
                    This will remove any special offer from the {selectedSkus.length} selected products
                    and restore their calculated prices.
                  </p>
                </div>
              ) : createNew ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Offer Name</label>
                    <input
                      type="text"
                      value={newOfferName}
                      onChange={(e) => setNewOfferName(e.target.value)}
                      placeholder="e.g., Summer Sale 2024"
                      className="w-full px-4 py-3 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      style={{ background: colors.bgInput, border: `1px solid ${colors.borderLight}` }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Discount Percentage
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={newOfferDiscount}
                        onChange={(e) => setNewOfferDiscount(e.target.value)}
                        placeholder="e.g., 15"
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-full px-4 py-3 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        style={{ background: colors.bgInput, border: `1px solid ${colors.borderLight}` }}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              ) : loadingOffers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Select Offer</label>
                  <select
                    value={selectedOfferId}
                    onChange={(e) => setSelectedOfferId(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{ background: colors.bgInput, border: `1px solid ${colors.borderLight}` }}
                  >
                    <option value="">Choose an offer...</option>
                    {offers.map((offer) => (
                      <option key={offer.id} value={offer.id}>
                        {offer.name} (-{offer.discount_percentage}%)
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
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Preview Impact</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Products Affected</p>
                      <p className="text-lg text-white">{preview.productsAffected}</p>
                    </div>
                    {preview.action === 'apply' && (
                      <div>
                        <p className="text-xs text-gray-500">Avg Savings</p>
                        <p className="text-lg text-green-400">
                          -£{Math.abs(preview.avgPriceChange || 0).toFixed(2)}
                        </p>
                      </div>
                    )}
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
                disabled={
                  loading ||
                  (!removeOffer && !selectedOfferId && (!newOfferName || !newOfferDiscount))
                }
                className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Preview Impact
              </button>
            ) : (
              <button
                onClick={handleApply}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-white disabled:opacity-50 flex items-center gap-2 ${
                  removeOffer
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {removeOffer ? 'Remove Offer' : `Apply to ${selectedSkus.length} Products`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SpecialOfferModal;
