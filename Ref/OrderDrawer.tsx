import React, { useState, useRef, useEffect } from 'react';
import { Minus, Plus, X, ShoppingBag, Sparkles, ChevronLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart, cartUtils } from '../contexts/CartContext';
import { Button } from './ui/button';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import ClothingOrderWizard, { LogoPreviewData, ContactFormData, CartItemPreview, CartItem } from './clothing/ClothingOrderWizard';
import ClothingHelpRequestForm from './clothing/ClothingHelpRequestForm';
import ClothingConsultationBooker from './clothing/ClothingConsultationBooker';
import { submitClothingEnquiry } from '../lib/enquiry-service';
import { sendEnquiryEmails } from '../lib/email-service';

// Design system colors
const colors = {
  dark: '#183028',
  darkLight: '#234a3a',
  accent: '#64a70b',
  accentHover: '#578f09',
  neutral: '#c1c6c8',
  neutralLight: '#e8eaeb',
  white: '#ffffff',
  textDark: '#333333',
  textMuted: '#666666',
};

interface OrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type QuoteStep = 'cart' | 'wizard' | 'help' | 'consult' | 'submitting' | 'success';

const OrderDrawer: React.FC<OrderDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    cart,
    removeFromCart,
    incrementQuantity,
    decrementQuantity,
    subtotal,
    tax,
    shipping,
    total,
  } = useCart();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [quoteStep, setQuoteStep] = useState<QuoteStep>('cart');
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [enquiryRef, setEnquiryRef] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset quote step when drawer closes
  useEffect(() => {
    if (!isOpen && !showQuoteModal) {
      setQuoteStep('cart');
      setSubmitError(null);
    }
  }, [isOpen, showQuoteModal]);

  const handleBrowseProducts = () => {
    onClose();
    navigate('/clothing');
  };

  const handleStartOrder = () => {
    if (isMobile) {
      setQuoteStep('wizard');
    } else {
      setShowQuoteModal(true);
      setQuoteStep('wizard');
      onClose();
    }
  };

  // Handle drag to dismiss (mobile)
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  // Convert cart items to format expected by ClothingOrderWizard
  const cartItemsForWizard: CartItem[] = cart.map(item => {
    const itemWithColors = item as any; // TypeScript doesn't know about availableColors
    return {
      id: item.id,
      name: item.name,
      image: item.image,
      brand: item.brand,
      selectedColor: item.selectedColor,
      availableColors: itemWithColors.availableColors?.map((c: any) => ({
        name: c.name,
        rgb: c.rgb,
        image: c.image,
        code: c.code,
      })) || [],
    };
  });

  // Get first cart item for single-item orders
  const firstCartItem = cart[0];

  // Handle path selection from ClothingOrderWizard
  const handleSelectPath = async (
    path: 'upload' | 'help' | 'consult',
    logoData?: LogoPreviewData,
    contactData?: ContactFormData,
    cartItemPreviews?: CartItemPreview[]
  ) => {
    // Handle upload path with contact data - submit to backend
    if (path === 'upload' && contactData && logoData) {
      setSubmitError(null);
      setQuoteStep('submitting');

      try {
        // Submit enquiry to Supabase
        const result = await submitClothingEnquiry({
          customerName: contactData.name,
          customerEmail: contactData.email,
          customerPhone: contactData.phone,
          productId: cart.length > 1 ? 'multi-item-order' : firstCartItem?.styleCode,
          productName: cart.length > 1 ? `${cart.length} items` : firstCartItem?.name || '',
          productStyleCode: cart.length > 1 ? undefined : firstCartItem?.styleCode,
          productColor: firstCartItem?.selectedColor,
          productImageUrl: firstCartItem?.image,
          logoData: logoData.logoSrc,
          logoAnalysis: logoData.analysis,
          logoPositionX: logoData.x,
          logoPositionY: logoData.y,
          logoSizePercent: logoData.size,
          estimatedQuantity: contactData.quantity,
          additionalNotes: contactData.notes,
          enquiryType: 'upload',
          // Include cart item previews for multi-item orders
          cartItems: cart.map(item => ({
            id: item.id,
            name: item.name,
            styleCode: item.styleCode,
            color: item.selectedColor,
            image: item.image,
            quantity: item.quantity,
          })),
          cartItemPreviews: cartItemPreviews,
        });

        if (result.success && result.enquiryId && result.enquiryRef) {
          setEnquiryRef(result.enquiryRef);

          // Send email notifications
          sendEnquiryEmails({
            customerEmail: contactData.email,
            customerName: contactData.name,
            customerPhone: contactData.phone,
            enquiryId: result.enquiryId,
            enquiryRef: result.enquiryRef,
            productName: cart.length > 1 ? `${cart.length} items` : firstCartItem?.name || '',
            enquiryType: 'upload',
            estimatedQuantity: contactData.quantity,
            additionalNotes: contactData.notes,
            logoQuality: logoData.analysis?.qualityTier,
          }).catch(console.error);

          setQuoteStep('success');
        } else {
          setSubmitError(result.error || 'Something went wrong. Please try again.');
          setQuoteStep('wizard');
        }
      } catch (error) {
        console.error('Submission error:', error);
        setSubmitError('Something went wrong. Please try again.');
        setQuoteStep('wizard');
      }
      return;
    }

    // Handle other paths (help, consult)
    switch (path) {
      case 'help':
        setQuoteStep('help');
        break;
      case 'consult':
        setQuoteStep('consult');
        break;
    }
  };

  // Render modal content based on step
  const renderModalContent = () => {
    switch (quoteStep) {
      case 'wizard':
        // Get all available colors from cart items
        // For single item, use availableColors stored from the product
        // For multi-item, each cart item already has its own colors stored
        const firstItem = cart[0] as any; // TypeScript doesn't know about availableColors yet
        const productColorsForWizard = firstItem?.availableColors?.map((c: any) => ({
          name: c.name,
          rgb: c.rgb,
          image: c.image,
          code: c.code,
        })) || [];

        // Find initial color index based on selected color
        const initialIdx = productColorsForWizard.findIndex(
          (c: any) => c.name === firstItem?.selectedColor || c.code === firstItem?.selectedColor
        );

        return (
          <ClothingOrderWizard
            productName={cart.length > 1 ? `${cart.length} items in your order` : firstCartItem?.name || 'Your Order'}
            productImage={firstCartItem?.image}
            productColors={productColorsForWizard}
            initialColorIndex={initialIdx >= 0 ? initialIdx : 0}
            onSelectPath={handleSelectPath}
            isMobile={isMobile}
            cartItems={cart.length > 1 ? cartItemsForWizard : []}
          />
        );

      case 'help':
        return (
          <ClothingHelpRequestForm
            productTitle={cart.length > 1 ? `${cart.length} items` : firstCartItem?.name || 'Your Order'}
            onBack={() => setQuoteStep('wizard')}
            onComplete={() => setQuoteStep('success')}
            isMobile={isMobile}
          />
        );

      case 'consult':
        return (
          <ClothingConsultationBooker
            productName={cart.length > 1 ? `${cart.length} items` : firstCartItem?.name || 'Your Order'}
            onBack={() => setQuoteStep('wizard')}
            onComplete={() => setQuoteStep('success')}
            isMobile={isMobile}
          />
        );

      case 'submitting':
        return (
          <div className="w-full max-w-xl mx-auto text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6">
              <div
                className="w-full h-full rounded-full border-4 border-t-transparent animate-spin"
                style={{ borderColor: `${colors.accent} transparent ${colors.accent} ${colors.accent}` }}
              />
            </div>
            <h2 className="hearns-font text-2xl text-white mb-2">
              Submitting your request...
            </h2>
            <p className="neuzeit-light-font text-white/60">
              Please wait while we process your enquiry
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="w-full max-w-xl mx-auto text-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center"
              style={{ backgroundColor: `${colors.accent}25` }}
            >
              <Check className="w-12 h-12" style={{ color: colors.accent }} />
            </motion.div>

            <h2 className="hearns-font text-3xl text-white mb-3">
              Request Received!
            </h2>

            {enquiryRef && (
              <div className="inline-block px-4 py-2 rounded-lg bg-white/10 border border-white/20 mb-4">
                <p className="embossing-font text-xs text-white/50 uppercase tracking-wide mb-1">
                  Your Reference
                </p>
                <p className="neuzeit-font text-xl font-bold" style={{ color: colors.accent }}>
                  {enquiryRef}
                </p>
              </div>
            )}

            <p className="embossing-font text-xl mb-4" style={{ color: colors.accent }}>
              We'll be in touch soon
            </p>
            <p className="neuzeit-light-font text-white/70 max-w-md mx-auto mb-8">
              Our team will review your request and get back to you within 24 hours with a mockup and quote.
              {enquiryRef && ' Keep your reference number handy for any enquiries.'}
            </p>

            <button
              onClick={() => {
                setShowQuoteModal(false);
                setQuoteStep('cart');
                setEnquiryRef('');
                onClose();
              }}
              className="px-6 py-3 rounded-xl neuzeit-font font-semibold text-black transition-all hover:opacity-90"
              style={{ backgroundColor: colors.accent }}
            >
              Continue Browsing
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen && !showQuoteModal) return null;

  // Desktop Quote Modal (separate from drawer)
  if (showQuoteModal && !isMobile) {
    return (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (quoteStep !== 'submitting') {
              setShowQuoteModal(false);
              setQuoteStep('cart');
            }
          }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        />
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: colors.dark }}
          >
            {/* Background texture */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: 'url(/BlackTextureBackground.webp)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />

            {/* Close button */}
            {quoteStep !== 'submitting' && (
              <button
                onClick={() => {
                  setShowQuoteModal(false);
                  setQuoteStep('cart');
                }}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            )}

            {/* Content */}
            <div className="relative z-10 p-6 md:p-10 overflow-y-auto max-h-[90vh] scrollbar-clothing">
              {/* Error message */}
              {submitError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 rounded-[12px] bg-red-500/10 border border-red-500/20 text-center"
                >
                  <p className="neuzeit-font text-sm text-red-400">{submitError}</p>
                  <button
                    onClick={() => setSubmitError(null)}
                    className="neuzeit-font text-xs text-red-300 hover:text-red-200 mt-2 underline"
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={quoteStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderModalContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  if (!isOpen) return null;

  // Mobile bottom sheet design
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-40"
              onClick={onClose}
            />

            {/* Bottom Sheet */}
            <motion.div
              ref={sheetRef}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              drag={quoteStep === 'submitting' ? false : 'y'}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  if (quoteStep === 'cart') {
                    onClose();
                  } else if (quoteStep !== 'submitting') {
                    setQuoteStep('cart');
                  }
                }
              }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
              style={{
                backgroundColor: colors.dark,
                maxHeight: '95vh',
                height: quoteStep !== 'cart' ? '95vh' : 'auto',
              }}
            >
              {/* Drag Handle - tappable to go back/close */}
              <div
                className="flex justify-center pt-3 pb-2 cursor-pointer"
                onClick={() => {
                  if (quoteStep === 'cart') {
                    onClose();
                  } else if (quoteStep !== 'submitting') {
                    setQuoteStep('cart');
                  }
                }}
              >
                <div className="w-10 h-1 rounded-full bg-white/30" />
              </div>

              {quoteStep !== 'cart' ? (
                // Quote flow content
                <div className="flex-1 overflow-y-auto px-4 py-3" style={{ maxHeight: 'calc(95vh - 40px)' }}>
                  {/* Back button for wizard step - goes back to cart */}
                  {quoteStep === 'wizard' && (
                    <button
                      onClick={() => setQuoteStep('cart')}
                      className="mb-3 text-white/70 flex items-center gap-1.5 text-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back to cart
                    </button>
                  )}
                  {/* Back button for other non-wizard steps */}
                  {quoteStep !== 'wizard' && quoteStep !== 'submitting' && quoteStep !== 'success' && (
                    <button
                      onClick={() => setQuoteStep('wizard')}
                      className="mb-3 text-white/70 flex items-center gap-1.5 text-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                  )}
                  {renderModalContent()}
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="px-5 pb-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="w-6 h-6" style={{ color: colors.accent }} />
                        <h2 className="text-xl font-bold text-white">
                          Your Order
                        </h2>
                        {cart.length > 0 && (
                          <span className="text-sm font-normal text-white/60">
                            ({cart.length} {cart.length === 1 ? 'item' : 'items'})
                          </span>
                        )}
                      </div>
                      <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-white/60" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto px-5 py-4" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                    {cart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <ShoppingBag className="w-16 h-16 text-white/30 mb-4" />
                        <p className="text-lg font-medium text-white mb-2">
                          You have not yet started an order
                        </p>
                        <p className="text-sm text-white/60 mb-6">
                          Browse our products to add them to your order
                        </p>
                        <button
                          onClick={handleBrowseProducts}
                          className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all"
                          style={{ backgroundColor: colors.accent }}
                        >
                          Browse Products
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <CartItemCard
                            key={item.id}
                            item={item}
                            onRemove={() => removeFromCart(item.id)}
                            onIncrement={() => incrementQuantity(item.id)}
                            onDecrement={() => decrementQuantity(item.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {cart.length > 0 && (
                    <div className="px-5 py-4 border-t border-white/10" style={{ backgroundColor: colors.dark }}>
                      {/* Totals */}
                      <div className="space-y-1.5 text-sm mb-4">
                        <div className="flex justify-between text-white/70">
                          <span>Subtotal</span>
                          <span>{cartUtils.formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span>VAT (20%)</span>
                          <span>{cartUtils.formatPrice(tax)}</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span>Shipping</span>
                          <span>{shipping === 0 ? 'FREE' : cartUtils.formatPrice(shipping)}</span>
                        </div>
                        <div className="border-t border-white/10 pt-2 mt-2" />
                        <div className="flex justify-between text-lg font-bold text-white">
                          <span>Total</span>
                          <span>{cartUtils.formatPrice(total)}</span>
                        </div>
                      </div>

                      {/* CTAs */}
                      <div className="space-y-2">
                        <button
                          onClick={handleStartOrder}
                          className="w-full py-3 rounded-lg font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                          style={{ backgroundColor: colors.accent }}
                        >
                          <Sparkles className="w-4 h-4" />
                          Start Order
                        </button>
                        <button
                          onClick={handleBrowseProducts}
                          className="w-full py-2.5 rounded-lg font-medium text-white/80 border border-white/20 transition-all active:scale-[0.98]"
                        >
                          Add More Products
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop drawer design
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:max-w-lg z-50 flex flex-col shadow-2xl overflow-hidden"
        style={{ backgroundColor: colors.dark }}
      >
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'url(/BlackTextureBackground.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Header */}
        <div className="relative z-10 border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6" style={{ color: colors.accent }} />
              <h2 className="hearns-font text-2xl text-white">
                Your Order
              </h2>
              {cart.length > 0 && (
                <span className="neuzeit-font text-sm font-normal text-white/50">
                  ({cart.length} {cart.length === 1 ? 'item' : 'items'})
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        {/* Cart Items - Scrollable */}
        <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-4 scrollbar-clothing">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: `${colors.accent}20` }}
              >
                <ShoppingBag className="w-10 h-10" style={{ color: colors.accent }} />
              </div>
              <p className="hearns-font text-xl text-white mb-2">
                You have not yet started an order
              </p>
              <p className="neuzeit-light-font text-sm text-white/60 mb-6">
                Browse our products to add them to your order
              </p>
              <button
                onClick={handleBrowseProducts}
                className="neuzeit-font font-semibold text-white px-6 py-3 rounded-xl transition-all hover:opacity-90"
                style={{ backgroundColor: colors.accent }}
              >
                Browse Products
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onRemove={() => removeFromCart(item.id)}
                onIncrement={() => incrementQuantity(item.id)}
                onDecrement={() => decrementQuantity(item.id)}
              />
            ))
          )}
        </div>

        {/* Footer with totals and CTAs */}
        {cart.length > 0 && (
          <div
            className="relative z-10 border-t border-white/10 p-6 space-y-4"
            style={{ backgroundColor: colors.dark }}
          >
            {/* Totals */}
            <div className="space-y-2 text-sm neuzeit-font">
              <div className="flex justify-between text-white/70">
                <span>Subtotal</span>
                <span>{cartUtils.formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>VAT (20%)</span>
                <span>{cartUtils.formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'FREE' : cartUtils.formatPrice(shipping)}</span>
              </div>
              {shipping > 0 && subtotal < 50 && (
                <p className="text-xs" style={{ color: colors.accent }}>
                  Add {cartUtils.formatPrice(50 - subtotal)} more for free shipping!
                </p>
              )}
              <div className="border-t border-white/10 pt-2 mt-2"></div>
              <div className="flex justify-between text-lg font-bold text-white">
                <span>Total</span>
                <span>{cartUtils.formatPrice(total)}</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-3">
              <button
                onClick={handleStartOrder}
                className="w-full py-3.5 rounded-xl neuzeit-font font-semibold text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: colors.accent,
                  boxShadow: `0 6px 20px ${colors.accent}40`,
                }}
              >
                <Sparkles className="w-4 h-4" />
                Start Order
              </button>
              <button
                onClick={handleBrowseProducts}
                className="w-full py-3 rounded-xl neuzeit-font font-medium text-white/80 border border-white/20 transition-all hover:bg-white/5"
              >
                Add More Products
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};

interface CartItemCardProps {
  item: {
    id: string;
    name: string;
    brand: string;
    price: number;
    quantity: number;
    image: string;
    selectedColor?: string;
    selectedSize?: string;
  };
  onRemove: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({ item, onRemove, onIncrement, onDecrement }) => {
  return (
    <div className="flex gap-4 p-4 rounded-[12px] bg-white/5 border border-white/10 transition-all hover:border-white/20">
      {/* Product Image */}
      <div className="w-20 h-20 rounded-[10px] overflow-hidden bg-white flex-shrink-0">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-contain p-1"
            onError={(e) => {
              e.currentTarget.src = `https://via.placeholder.com/80x80/183028/64a70b?text=${encodeURIComponent(item.name.slice(0, 2))}`;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.darkLight }}>
            <ShoppingBag className="w-8 h-8 text-white/40" />
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <h3 className="neuzeit-font font-medium text-white text-sm truncate">
              {item.name}
            </h3>
            <p className="neuzeit-light-font text-xs text-white/50">
              {item.brand}
              {item.selectedColor && ` • ${item.selectedColor}`}
              {item.selectedSize && ` • ${item.selectedSize}`}
            </p>
          </div>
          <button
            onClick={onRemove}
            className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors group flex-shrink-0"
            aria-label="Remove item"
          >
            <X className="w-4 h-4 text-white/40 group-hover:text-red-400 transition-colors" />
          </button>
        </div>

        {/* Price and Quantity */}
        <div className="flex items-center justify-between mt-3">
          <span className="neuzeit-font font-semibold text-white">
            {cartUtils.formatPrice(item.price)}
          </span>

          {/* Quantity Controls */}
          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
            <button
              onClick={onDecrement}
              className="p-1.5 rounded-md transition-colors hover:bg-white/10"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3 h-3 text-white/70" />
            </button>
            <span className="w-8 text-center text-sm font-medium text-white neuzeit-font">
              {item.quantity}
            </span>
            <button
              onClick={onIncrement}
              className="p-1.5 rounded-md transition-colors"
              style={{ backgroundColor: `${colors.accent}30` }}
              aria-label="Increase quantity"
            >
              <Plus className="w-3 h-3" style={{ color: colors.accent }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDrawer;
