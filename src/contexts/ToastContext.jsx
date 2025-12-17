import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ShoppingBag, X } from 'lucide-react'

const ToastContext = createContext(null)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, options = {}) => {
    const id = Date.now()
    const toast = {
      id,
      message,
      type: options.type || 'success',
      duration: options.duration || 3000,
      product: options.product || null
    }

    setToasts(prev => [...prev, toast])

    // Auto-remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, toast.duration)

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showCartToast = useCallback((product, quantity = 1) => {
    addToast(`Added to cart`, {
      type: 'cart',
      product: {
        name: product.name,
        image: product.media || product.image_url || product.images?.[0],
        quantity,
        price: product.final_price ?? product.calculated_price ?? product.price
      },
      duration: 3000
    })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ addToast, removeToast, showCartToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  )
}

const Toast = ({ toast, onRemove }) => {
  const isCartToast = toast.type === 'cart' && toast.product

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="pointer-events-auto"
    >
      <div className="bg-gradient-to-r from-[#2a3138] to-[#303843] border border-emerald-500/30 rounded-xl shadow-2xl shadow-black/40 backdrop-blur-md overflow-hidden min-w-[320px] max-w-[400px]">
        {isCartToast ? (
          <div className="flex items-center gap-4 p-4">
            {/* Product Image */}
            {toast.product.image && (
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                <img
                  src={toast.product.image}
                  alt={toast.product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
                <span className="text-emerald-400 text-sm font-semibold">Added to Cart</span>
              </div>
              <p className="text-white text-sm font-medium truncate">{toast.product.name}</p>
              {toast.product.quantity > 1 && (
                <p className="text-gray-400 text-xs">Qty: {toast.product.quantity}</p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => onRemove(toast.id)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4">
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
            <span className="text-white text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => onRemove(toast.id)}
              className="p-1 hover:bg-white/10 rounded transition-colors ml-auto"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}

        {/* Progress bar */}
        <motion.div
          className="h-0.5 bg-emerald-500"
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
          style={{ transformOrigin: 'left' }}
        />
      </div>
    </motion.div>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
