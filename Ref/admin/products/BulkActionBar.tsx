import React, { useState } from 'react';
import { X, Calculator, Tag, Trash2 } from 'lucide-react';
import { useDrillDown } from './ProductManager/DrillDownContext';
import { ApplyRuleModal } from './modals/ApplyRuleModal';
import { SpecialOfferModal } from './modals/SpecialOfferModal';

const colors = {
  bgCard: '#2a2440',
  bgCardHover: '#3d3456',
  purple500: '#8b5cf6',
  borderLight: 'rgba(139, 92, 246, 0.1)',
};

export function BulkActionBar() {
  const { selectedSkus, clearSelection } = useDrillDown();
  const [showApplyRule, setShowApplyRule] = useState(false);
  const [showSpecialOffer, setShowSpecialOffer] = useState(false);

  if (selectedSkus.length === 0) return null;

  const handleSuccess = () => {
    clearSelection();
  };

  return (
    <>
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-6 py-3 rounded-xl shadow-2xl"
        style={{
          background: colors.bgCard,
          border: `1px solid ${colors.borderLight}`,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Selection count */}
        <div className="flex items-center gap-2 pr-4 border-r border-gray-600">
          <span className="text-purple-400 font-semibold">{selectedSkus.length}</span>
          <span className="text-gray-400 text-sm">selected</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowApplyRule(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
          >
            <Calculator className="w-4 h-4" />
            <span className="text-sm font-medium">Apply Margin</span>
          </button>

          <button
            onClick={() => setShowSpecialOffer(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors"
          >
            <Tag className="w-4 h-4" />
            <span className="text-sm font-medium">Special Offer</span>
          </button>
        </div>

        {/* Clear selection */}
        <button
          onClick={clearSelection}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors ml-2"
          title="Clear selection"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Modals */}
      <ApplyRuleModal
        isOpen={showApplyRule}
        onClose={() => setShowApplyRule(false)}
        selectedSkus={selectedSkus}
        onSuccess={handleSuccess}
      />

      <SpecialOfferModal
        isOpen={showSpecialOffer}
        onClose={() => setShowSpecialOffer(false)}
        selectedSkus={selectedSkus}
        onSuccess={handleSuccess}
      />
    </>
  );
}

export default BulkActionBar;
