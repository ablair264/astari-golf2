import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { X, ArrowRight, ZoomIn, Eye, Tag, Shirt } from 'lucide-react';
import { ProductGroup } from './ClothingBrowser';
import { ImageZoom, Image } from '../animate-ui/primitives/effects/image-zoom';

// Theme colors - Brand palette (matching ClothingBrowser)
const clothingColors = {
  accent: '#64a70b',      // Primary green
  text: '#333333',        // Body text (80%)
  dark: '#183028',        // Dark green
  light: '#c1c6c8',       // Light gray
  secondary: '#1e3a2f',   // Card background (slightly lighter than dark)
};

// Brand name to domain mapping for Brandfetch API
const BRAND_DOMAINS: Record<string, string> = {
  'adidas®': 'adidas.com',
  'Nike': 'nike.com',
  'Under Armour': 'underarmour.com',
  'Under Armour Golf': 'underarmour.com',
  'New Era': 'neweracap.com',
  'Fruit of the Loom': 'fruitoftheloom.com',
  'Gildan': 'gildan.com',
  'Bella Canvas': 'bellacanvas.com',
  'Comfort Colors®': 'comfortcolors.com',
  'Jack Wolfskin': 'jack-wolfskin.com',
  'Craghoppers': 'craghoppers.com',
  'Regatta Professional': 'regatta.com',
  'Regatta Junior': 'regatta.com',
  'Regatta Honestly Made': 'regatta.com',
  'Regatta High Visibility': 'regatta.com',
  'Regatta Safety Footwear': 'regatta.com',
  'Stanley/Stella': 'stanleystella.com',
  'Stormtech': 'stormtech.ca',
  'AWDis': 'awdis.com',
  'AWDis Academy': 'awdis.com',
  'AWDis Ecologie': 'awdis.com',
  'AWDis Just Cool': 'awdis.com',
  'AWDis Just Hoods': 'awdis.com',
  "AWDis Just Polo's": 'awdis.com',
  "AWDis Just T's": 'awdis.com',
  'AWDis So Denim': 'awdis.com',
  'Russell Collection': 'russelleurope.com',
  'Russell Europe': 'russelleurope.com',
  'B&C Collection': 'bc-collection.eu',
  'Callaway': 'callawaygolf.com',
  'OGIO': 'ogio.com',
  'Snickers': 'snickersworkwear.com',
  'Portwest': 'portwest.com',
  'Result': 'resultclothing.com',
  'Result Core': 'resultclothing.com',
  'Result Genuine Recycled': 'resultclothing.com',
  'Result Headwear': 'resultclothing.com',
  'Result Safeguard': 'resultclothing.com',
  'Result Urban Outdoor': 'resultclothing.com',
  'Result Winter Essentials': 'resultclothing.com',
  'Result Workguard': 'resultclothing.com',
  'Nimbus': 'nimbuswear.com',
  'Scruffs': 'scruffs.com',
};

// Get Brandfetch logo URL for a brand
const getBrandLogoUrl = (brandName: string): string | null => {
  const domain = BRAND_DOMAINS[brandName];
  if (!domain) return null;
  // Using Brandfetch CDN - returns WebP by default
  return `https://cdn.brandfetch.io/${domain}/w/128/h/32?c=1idwNSepBcgUb6Y8Sjq`;
};

// Font families
const fonts = {
  heading: "'Hearns', serif",
  subheading: "'Embossing Tape 3', sans-serif",
  body: "'Neuzeit Grotesk', sans-serif",
};

interface ClothingCardProps {
  productGroup: ProductGroup;
  index: number;
  isExpanded: boolean;
  hasExpandedCard: boolean;
  onExpand: () => void;
  onClose: () => void;
  expandedRef?: (node: HTMLDivElement | null) => void;
}

const formatSizeRange = (sizeRange: string): string => {
  if (!sizeRange) return '';
  return sizeRange
    .replace(/to/gi, ' – ')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-zA-Z])/g, '$1$2')
    .trim();
};

const ClothingCard: React.FC<ClothingCardProps> = ({
  productGroup,
  index,
  isExpanded,
  hasExpandedCard,
  onExpand,
  onClose,
  expandedRef,
}) => {
  const navigate = useNavigate();
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  const currentColor = productGroup.colors[selectedColorIndex];
  const currentImage = currentColor?.image || productGroup.variants[0]?.primary_product_image_url;

  // Determine if this card should be dimmed
  const shouldDim = hasExpandedCard && !isExpanded;

  // Display colors (max 5 in collapsed, all in expanded)
  const displayColors = isExpanded ? productGroup.colors : productGroup.colors.slice(0, 5);
  const remainingColors = productGroup.colors.length - 5;

  // Use the pre-computed size_range from the ProductGroup, formatted nicely
  const sizeRange = productGroup.size_range
    ? formatSizeRange(productGroup.size_range)
    : '';

  return (
    <motion.div
      ref={isExpanded ? expandedRef : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: Math.min(index * 0.02, 0.2),
        layout: {
          duration: 0.25,
          ease: 'easeOut'
        }
      }}
      layout
      className={`
        ${isExpanded ? 'col-span-2 md:col-span-3 lg:col-span-4 z-10' : ''}
      `}
    >
      <motion.div
        layout="position"
        transition={{
          layout: {
            duration: 0.25,
            ease: 'easeOut'
          }
        }}
        className={`group w-full h-full rounded-2xl overflow-hidden border border-white/10 relative ${
          isExpanded
            ? 'shadow-2xl shadow-black/30'
            : 'hover:shadow-lg hover:border-white/20 transition-shadow duration-150'
        }`}
        style={{ backgroundColor: clothingColors.secondary }}
      >
        {/* Dark overlay when another card is expanded */}
        {shouldDim && (
          <div className="absolute inset-0 bg-black/40 z-10 rounded-2xl pointer-events-none transition-opacity duration-200" />
        )}

        {!isExpanded ? (
          /* Collapsed Card */
          <button
            onClick={onExpand}
            className="w-full h-full text-left flex flex-col"
          >
            {/* Image */}
            <div className="aspect-[4/3] overflow-hidden bg-white relative">
              <img
                src={currentImage !== 'Not available'
                  ? currentImage
                  : `https://via.placeholder.com/400x400/ffffff/78BE20?text=${encodeURIComponent(productGroup.style_name?.slice(0, 2) || 'P')}`
                }
                alt={productGroup.style_name}
                className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = `https://via.placeholder.com/400x400/ffffff/78BE20?text=${encodeURIComponent(productGroup.style_name?.slice(0, 2) || 'P')}`;
                }}
                loading="lazy"
              />

              {/* Hover overlay with eye icon */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-3 shadow-lg">
                  <Eye className="w-5 h-5 text-gray-800" />
                </div>
              </div>

              {/* Color count badge */}
              {productGroup.colors.length > 1 && (
                <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/70 text-white text-xs font-medium z-10">
                  {productGroup.colors.length} colours
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
              {/* Brand */}
              <p className="text-[11px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: clothingColors.accent }}>
                {productGroup.brand}
              </p>

              {/* Name */}
              <h3 className="text-sm text-white leading-tight mb-2 line-clamp-3 sm:line-clamp-2 min-h-[48px] sm:min-h-[40px]" style={{ fontFamily: fonts.subheading }}>
                {productGroup.style_name}
              </h3>

              {/* Price */}
              {productGroup.price_range && productGroup.price_range.min > 0 && (
                <p className="text-lg font-bold text-white mb-3" style={{ fontFamily: fonts.body }}>
                  From £{productGroup.price_range.min.toFixed(2)}
                </p>
              )}

              {/* Color swatches */}
              {productGroup.colors.length > 0 && (
                <div className="flex items-center gap-1.5 mt-auto">
                  {displayColors.map((color, i) => (
                    <div
                      key={color.code}
                      className="w-5 h-5 rounded-full border border-white/20"
                      style={{ backgroundColor: color.rgb }}
                      title={color.name}
                    />
                  ))}
                  {remainingColors > 0 && (
                    <span className="text-xs text-white/50 ml-1">+{remainingColors}</span>
                  )}
                </div>
              )}
            </div>
          </button>
        ) : (
          /* Expanded Card - Horizontal on desktop, compact vertical on mobile */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="relative cursor-pointer"
            onClick={onClose}
          >
            {/* Desktop: Horizontal layout */}
            <div className="hidden sm:flex">
              {/* Image section - with zoom capability */}
              <div
                className="w-[180px] bg-white relative flex-shrink-0 rounded-l-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={onClose}
                  className="absolute top-3 left-3 z-20 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-all backdrop-blur-sm"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>

                <motion.div
                  className="absolute bottom-3 right-3 z-20 p-1.5 rounded-full bg-black/50 pointer-events-none backdrop-blur-sm"
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: isImageZoomed ? 0 : 0.8 }}
                >
                  <ZoomIn className="w-3 h-3 text-white" />
                </motion.div>

                <ImageZoom
                  zoomScale={2.5}
                  zoomOnHover={false}
                  zoomOnClick={true}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <Image
                    src={currentImage !== 'Not available'
                      ? currentImage
                      : `https://via.placeholder.com/600x600/ffffff/78BE20?text=${encodeURIComponent(productGroup.style_name?.slice(0, 2) || 'P')}`
                    }
                    alt={productGroup.style_name}
                    objectFit="contain"
                    style={{ padding: '1rem' }}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      e.currentTarget.src = `https://via.placeholder.com/600x600/ffffff/78BE20?text=${encodeURIComponent(productGroup.style_name?.slice(0, 2) || 'P')}`;
                    }}
                  />
                </ImageZoom>
              </div>

              {/* Content - horizontal layout spread across full width */}
              <div className="flex-1 px-6 py-4 flex items-center justify-between min-w-0">
                {/* Product Info */}
                <div className="min-w-[180px] max-w-[220px]">
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: clothingColors.accent }}>
                    {productGroup.brand}
                  </p>
                  <h3 className="text-base text-white leading-snug mb-1.5" style={{ fontFamily: fonts.subheading }}>
                    {productGroup.style_name}
                  </h3>
                  {productGroup.price_range && productGroup.price_range.min > 0 && (
                    <p className="text-lg font-bold text-white" style={{ fontFamily: fonts.body }}>
                      £{productGroup.price_range.min.toFixed(2)}
                      {productGroup.price_range.min !== productGroup.price_range.max && (
                        <span className="text-xs font-normal text-white/40 ml-1.5">
                          – £{productGroup.price_range.max.toFixed(2)}
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <div className="w-px h-16 bg-white/10 flex-shrink-0 mx-4" />

                {/* Colors */}
                {productGroup.colors.length > 0 && (
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-2">
                      {productGroup.colors.length} Colours
                    </p>
                    <div className="flex flex-wrap gap-2 max-w-[200px]">
                      {productGroup.colors.slice(0, 15).map((color, i) => (
                        <button
                          key={color.code}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedColorIndex(i);
                          }}
                          className={`w-7 h-7 rounded-full transition-all duration-150 ${
                            selectedColorIndex === i
                              ? 'ring-2 ring-offset-2 ring-offset-[#1e3a2f] ring-[#64a70b] scale-110'
                              : 'ring-1 ring-white/20 hover:ring-white/40'
                          }`}
                          style={{ backgroundColor: color.rgb }}
                          title={color.name}
                        />
                      ))}
                      {productGroup.colors.length > 15 && (
                        <span className="w-7 h-7 rounded-full bg-white/10 text-[10px] text-white/60 flex items-center justify-center">
                          +{productGroup.colors.length - 15}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/40 mt-1.5 truncate max-w-[180px]">{currentColor?.name}</p>
                  </div>
                )}

                <div className="w-px h-16 bg-white/10 flex-shrink-0 mx-4" />

                {/* Sizes */}
                {sizeRange && (
                  <div className="flex-shrink-0">
                    <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-2">Sizes</p>
                    <p className="text-white text-base font-medium whitespace-nowrap">{sizeRange}</p>
                  </div>
                )}

                <div className="w-px h-16 bg-white/10 flex-shrink-0 mx-4" />

                {/* Key Features */}
                {(productGroup.product_feature_1 || productGroup.product_feature_2 || productGroup.product_feature_3) && (
                  <div className="flex-shrink-0 min-w-[140px]">
                    <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Shirt className="w-3.5 h-3.5" />
                      Key Features
                    </p>
                    <ul className="text-[12px] text-white/70 space-y-1">
                      {productGroup.product_feature_1 && <li>• {productGroup.product_feature_1}</li>}
                      {productGroup.product_feature_2 && <li>• {productGroup.product_feature_2}</li>}
                      {productGroup.product_feature_3 && <li>• {productGroup.product_feature_3}</li>}
                    </ul>
                  </div>
                )}

                {/* CTA */}
                <div className="flex-shrink-0 ml-6">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/products/${productGroup.style_code}`);
                    }}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                    style={{ backgroundColor: clothingColors.accent, boxShadow: '0 4px 12px rgba(100, 167, 11, 0.3)' }}
                  >
                    View Details
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile: Refined compact layout */}
            <div className="flex sm:hidden flex-col p-3 gap-3 overflow-hidden">
              {/* Top row: Image + Info */}
              <div className="flex gap-3">
                {/* Image - clean square with shadow */}
                <div
                  className="w-[80px] h-[80px] bg-white flex-shrink-0 rounded-xl overflow-hidden relative shadow-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={onClose}
                    className="absolute top-1 left-1 z-20 p-0.5 rounded-full bg-black/40"
                  >
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                  <img
                    src={currentImage !== 'Not available'
                      ? currentImage
                      : `https://via.placeholder.com/300x300/ffffff/78BE20?text=${encodeURIComponent(productGroup.style_name?.slice(0, 2) || 'P')}`
                    }
                    alt={productGroup.style_name}
                    className="w-full h-full object-contain p-1.5"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      e.currentTarget.src = `https://via.placeholder.com/300x300/ffffff/78BE20?text=${encodeURIComponent(productGroup.style_name?.slice(0, 2) || 'P')}`;
                    }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-0.5" style={{ color: clothingColors.accent }}>
                    {productGroup.brand}
                  </p>
                  <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2 mb-1" style={{ fontFamily: fonts.subheading }}>
                    {productGroup.style_name}
                  </h3>
                  {productGroup.price_range && productGroup.price_range.min > 0 && (
                    <p className="text-base font-bold text-white" style={{ fontFamily: fonts.body }}>
                      £{productGroup.price_range.min.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom row: Colors/Sizes + CTA */}
              <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                {/* Colors & Sizes info */}
                <div className="flex items-center gap-3 min-w-0">
                  {productGroup.colors.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-1">
                        {productGroup.colors.slice(0, 4).map((color, i) => (
                          <div
                            key={color.code}
                            className="w-5 h-5 rounded-full ring-1 ring-white/20"
                            style={{ backgroundColor: color.rgb }}
                          />
                        ))}
                      </div>
                      {productGroup.colors.length > 1 && (
                        <span className="text-[11px] text-white/50">
                          {productGroup.colors.length} colours
                        </span>
                      )}
                    </div>
                  )}
                  {sizeRange && (
                    <span className="text-[11px] text-white/50 truncate">{sizeRange}</span>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/products/${productGroup.style_code}`);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm text-white flex-shrink-0"
                  style={{ backgroundColor: clothingColors.accent }}
                >
                  View Details
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

    </motion.div>
  );
};

export default ClothingCard;
