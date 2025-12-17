import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, X, Sparkles, User, PhoneCall, Loader2 } from 'lucide-react'

const LIVECHAT_API = '/.netlify/functions/livechat'
const AI_CHAT_API = '/.netlify/functions/ai-chat'

// Generate or retrieve visitor ID
const getVisitorId = () => {
  const stored = localStorage.getItem('astari_visitor_id')
  if (stored) return stored

  const newId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  localStorage.setItem('astari_visitor_id', newId)
  return newId
}

const UnifiedChatWidget = () => {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // LiveChat state
  const [sessionId, setSessionId] = useState(null)
  const [isAdminOnline, setIsAdminOnline] = useState(false)
  const [adminJoined, setAdminJoined] = useState(false)
  const [showEscalateForm, setShowEscalateForm] = useState(false)
  const [escalateName, setEscalateName] = useState('')
  const [escalateEmail, setEscalateEmail] = useState('')
  const [escalating, setEscalating] = useState(false)
  const pollInterval = useRef(null)

  // Check admin online status
  const checkAdminStatus = useCallback(async () => {
    try {
      const response = await fetch(`${LIVECHAT_API}/status`)
      const data = await response.json()
      if (data.success) {
        setIsAdminOnline(data.isOnline)
      }
    } catch (error) {
      console.error('Failed to check admin status:', error)
    }
  }, [])

  // Initialize or restore session
  const initSession = useCallback(async () => {
    try {
      const visitorId = getVisitorId()
      const productContext = location.pathname.startsWith('/products/') ? {
        page: location.pathname,
      } : null

      const response = await fetch(`${LIVECHAT_API}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId,
          currentPage: location.pathname,
          productContext,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setSessionId(data.session.id)
        setAdminJoined(data.session.status === 'admin_joined')

        // Restore messages from session
        if (data.messages && data.messages.length > 0) {
          const restoredMessages = data.messages.map(m => ({
            id: m.id,
            role: m.sender_type === 'visitor' ? 'user' : m.sender_type,
            content: m.content,
            adminName: m.admin_name,
          }))
          setMessages(restoredMessages)
        }
      }
    } catch (error) {
      console.error('Failed to init session:', error)
    }
  }, [location.pathname])

  // Poll for new messages
  const pollMessages = useCallback(async () => {
    if (!sessionId) return

    try {
      const lastMessage = messages[messages.length - 1]
      const since = lastMessage ? new Date(Date.now() - 5000).toISOString() : undefined

      const url = since
        ? `${LIVECHAT_API}/messages/${sessionId}?since=${since}`
        : `${LIVECHAT_API}/messages/${sessionId}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        if (data.adminJoined && !adminJoined) {
          setAdminJoined(true)
        }

        // Add any new non-visitor messages
        if (data.messages && data.messages.length > 0) {
          const nonVisitorMessages = data.messages.filter(m => m.sender_type !== 'visitor')
          const existingContents = new Set(messages.map(m => m.content))
          const newMessages = nonVisitorMessages.filter(m => !existingContents.has(m.content))

          if (newMessages.length > 0) {
            const formattedNew = newMessages.map(m => ({
              id: m.id,
              role: m.sender_type === 'visitor' ? 'user' : m.sender_type,
              content: m.content,
              adminName: m.admin_name,
            }))
            setMessages(prev => [...prev, ...formattedNew])
          }
        }
      }
    } catch (error) {
      console.error('Failed to poll messages:', error)
    }
  }, [sessionId, messages, adminJoined])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Check admin status when chat opens
  useEffect(() => {
    if (isOpen) {
      checkAdminStatus()
    }
  }, [checkAdminStatus, isOpen])

  // Initialize session when chat opens
  useEffect(() => {
    if (isOpen) {
      initSession()
    }
  }, [isOpen, initSession])

  // Poll for messages
  useEffect(() => {
    if (isOpen && sessionId) {
      pollInterval.current = setInterval(pollMessages, 2000)
    }

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current)
      }
    }
  }, [isOpen, sessionId, pollMessages])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setShowEscalateForm(false)
        // Keep session and messages for continuity
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Save message to backend
  const saveMessage = async (senderType, content) => {
    if (!sessionId) return

    try {
      await fetch(`${LIVECHAT_API}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          senderType,
          content,
        }),
      })
    } catch (error) {
      console.error('Failed to save message:', error)
    }
  }

  // Escalate to human
  const handleEscalate = async () => {
    if (!sessionId) return

    setEscalating(true)
    try {
      await fetch(`${LIVECHAT_API}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          visitorName: escalateName || null,
          visitorEmail: escalateEmail || null,
        }),
      })

      setShowEscalateForm(false)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: isAdminOnline
          ? 'A team member will join shortly. Please wait...'
          : "Our team is currently offline. We'll get back to you as soon as possible!",
      }])
    } catch (error) {
      console.error('Failed to escalate:', error)
    } finally {
      setEscalating(false)
    }
  }

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      if (adminJoined) {
        // Admin has taken over - just save the message
        await saveMessage('visitor', trimmed)
      } else {
        // Save message and get AI response
        await saveMessage('visitor', trimmed)

        const response = await fetch(AI_CHAT_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            history: messages.filter(m => m.role !== 'system').map(m => ({
              role: m.role === 'user' ? 'user' : 'assistant',
              content: m.content
            })),
          }),
        })

        const data = await response.json()
        const aiResponse = data.reply || 'Sorry, I had trouble with that.'

        // Save AI response to backend
        await saveMessage('ai', aiResponse)

        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponse,
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Network error. Please try again.',
      }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, adminJoined, sessionId])

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-600 text-white font-medium shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="hidden sm:inline">Chat with us</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[550px] max-h-[80vh] bg-[#0f1621] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center relative">
                  <MessageCircle size={20} className="text-emerald-400" />
                  {adminJoined && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f1621]" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {adminJoined ? 'Live Chat' : 'ASTARI Support'}
                  </h2>
                  <p className="text-xs text-white/50">
                    {adminJoined
                      ? 'Connected with team member'
                      : isAdminOnline
                        ? 'Team available'
                        : 'AI assistant'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X size={20} className="text-white/60" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                    <Sparkles size={28} className="text-emerald-400" />
                  </div>
                  <h3 className="text-base font-medium text-white mb-2">Hi there!</h3>
                  <p className="text-sm text-white/50 max-w-xs mx-auto">
                    Ask about our products, pricing, or anything else. We're here to help!
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'}`}
                >
                  {msg.role === 'system' ? (
                    <div className="px-4 py-2 rounded-xl bg-yellow-500/10 text-yellow-300/80 text-sm text-center max-w-[90%]">
                      {msg.content}
                    </div>
                  ) : (
                    <>
                      {(msg.role === 'assistant' || msg.role === 'admin' || msg.role === 'ai') && (
                        <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                          msg.role === 'admin' ? 'bg-purple-500/20' : 'bg-emerald-500/20'
                        }`}>
                          {msg.role === 'admin' ? (
                            <User size={14} className="text-purple-400" />
                          ) : (
                            <Sparkles size={14} className="text-emerald-400" />
                          )}
                        </div>
                      )}
                      <div className="flex flex-col max-w-[80%]">
                        {msg.role === 'admin' && msg.adminName && (
                          <span className="text-xs text-purple-400 mb-1">{msg.adminName}</span>
                        )}
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm ${
                            msg.role === 'user'
                              ? 'bg-emerald-600 text-white rounded-br-sm'
                              : msg.role === 'admin'
                                ? 'bg-purple-500/20 text-purple-100 rounded-bl-sm'
                                : 'bg-white/10 text-white/90 rounded-bl-sm'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-7 h-7 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center">
                          <User size={14} className="text-white/70" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex-shrink-0 flex items-center justify-center">
                    <Sparkles size={14} className="text-emerald-400" />
                  </div>
                  <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-2 h-2 rounded-full bg-emerald-400"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Escalate Form */}
            {showEscalateForm && !adminJoined && (
              <div className="p-4 border-t border-white/10 bg-white/5">
                <p className="text-sm text-white/70 mb-3">
                  {isAdminOnline
                    ? 'Enter your details and a team member will join shortly:'
                    : "Leave your details and we'll get back to you:"}
                </p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={escalateName}
                    onChange={(e) => setEscalateName(e.target.value)}
                    placeholder="Your name (optional)"
                    className="w-full px-3 py-2 rounded-lg bg-white/10 text-white text-base placeholder-white/40 outline-none border border-white/10 focus:border-emerald-500/50"
                    style={{ fontSize: '16px' }}
                  />
                  <input
                    type="email"
                    value={escalateEmail}
                    onChange={(e) => setEscalateEmail(e.target.value)}
                    placeholder="Your email (optional)"
                    className="w-full px-3 py-2 rounded-lg bg-white/10 text-white text-base placeholder-white/40 outline-none border border-white/10 focus:border-emerald-500/50"
                    style={{ fontSize: '16px' }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowEscalateForm(false)}
                      className="flex-1 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEscalate}
                      disabled={escalating}
                      className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium disabled:opacity-50"
                    >
                      {escalating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Connect'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-white/10">
              {/* Talk to human button */}
              {!adminJoined && !showEscalateForm && messages.length >= 2 && (
                <button
                  onClick={() => setShowEscalateForm(true)}
                  className="w-full mb-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <PhoneCall size={14} />
                  <span>Speak to a team member</span>
                  {isAdminOnline && (
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  )}
                </button>
              )}

              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  disabled={loading}
                  className="flex-1 bg-transparent text-base sm:text-sm text-white placeholder-white/40 outline-none"
                  style={{ fontSize: '16px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-600 disabled:opacity-40 transition-opacity"
                >
                  <Send size={16} className="text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default UnifiedChatWidget
