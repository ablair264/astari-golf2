import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageCircle,
  Send,
  User,
  Bot,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PhoneCall,
  X,
  ExternalLink,
  RefreshCw,
  Bell,
  Volume2,
} from 'lucide-react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { DashboardSidebar } from '@/components/admin/dashboard-sidebar'

// Notification sound
const NOTIFICATION_SOUND = '/audio/notification.mp3'

const playNotificationSound = () => {
  try {
    const audio = new Audio(NOTIFICATION_SOUND)
    audio.volume = 0.5
    audio.play().catch(() => {})
  } catch (e) {
    console.log('Could not play notification sound')
  }
}

const API_BASE = '/.netlify/functions/livechat'

// Get auth token from localStorage
const getAuthToken = () => localStorage.getItem('adminToken') || ''

export default function AdminLiveChat() {
  const token = getAuthToken()
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [takingOver, setTakingOver] = useState(false)
  const messagesEndRef = useRef(null)
  const pollInterval = useRef(null)

  // Notification state
  const [notificationModal, setNotificationModal] = useState(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const soundEnabledRef = useRef(true)
  const seenWaitingSessions = useRef(new Set())
  const isFirstLoad = useRef(true)

  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  // Fetch all sessions
  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        const waitingSessions = data.sessions.filter(s => s.status === 'waiting_for_admin')

        waitingSessions.forEach(session => {
          if (!seenWaitingSessions.current.has(session.id)) {
            seenWaitingSessions.current.add(session.id)

            if (!isFirstLoad.current) {
              if (soundEnabledRef.current) {
                playNotificationSound()
              }
              setNotificationModal(session)
            }
          }
        })

        seenWaitingSessions.current.forEach(id => {
          const session = data.sessions.find(s => s.id === id)
          if (!session || session.status !== 'waiting_for_admin') {
            seenWaitingSessions.current.delete(id)
          }
        })

        setSessions(data.sessions)
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }, [token])

  // Fetch messages for selected session
  const fetchMessages = useCallback(async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE}/admin/session/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setMessages(data.messages)
        setSelectedSession(data.session)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }, [token])

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchSessions()
      isFirstLoad.current = false
      setLoading(false)
    }
    loadData()
  }, [fetchSessions])

  // Poll for updates
  useEffect(() => {
    pollInterval.current = setInterval(() => {
      fetchSessions()
      if (selectedSession) {
        fetchMessages(selectedSession.id)
      }
    }, 3000)

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current)
      }
    }
  }, [fetchSessions, fetchMessages, selectedSession])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSelectSession = async (session) => {
    setSelectedSession(session)
    await fetchMessages(session.id)
  }

  const handleTakeover = async () => {
    if (!selectedSession) return

    setTakingOver(true)
    try {
      const response = await fetch(`${API_BASE}/admin/takeover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId: selectedSession.id }),
      })
      const data = await response.json()
      if (data.success) {
        await fetchMessages(selectedSession.id)
        await fetchSessions()
      }
    } catch (error) {
      console.error('Failed to take over:', error)
    } finally {
      setTakingOver(false)
    }
  }

  const handleTakeoverFromNotification = async (session) => {
    setNotificationModal(null)
    setSelectedSession(session)
    await fetchMessages(session.id)

    setTakingOver(true)
    try {
      const response = await fetch(`${API_BASE}/admin/takeover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId: session.id }),
      })
      const data = await response.json()
      if (data.success) {
        await fetchMessages(session.id)
        await fetchSessions()
      }
    } catch (error) {
      console.error('Failed to take over:', error)
    } finally {
      setTakingOver(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedSession) return

    setSendingMessage(true)
    try {
      const response = await fetch(`${API_BASE}/admin/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          content: newMessage.trim(),
        }),
      })
      const data = await response.json()
      if (data.success) {
        setNewMessage('')
        await fetchMessages(selectedSession.id)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleCloseSession = async () => {
    if (!selectedSession) return

    try {
      const response = await fetch(`${API_BASE}/admin/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId: selectedSession.id }),
      })
      const data = await response.json()
      if (data.success) {
        setSelectedSession(null)
        setMessages([])
        await fetchSessions()
      }
    } catch (error) {
      console.error('Failed to close session:', error)
    }
  }

  const formatTime = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'waiting_for_admin':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs">
            <PhoneCall className="w-3 h-3" />
            Waiting
          </span>
        )
      case 'admin_joined':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs">
            <Bot className="w-3 h-3" />
            AI Chat
          </span>
        )
    }
  }

  const getMessageStyle = (senderType) => {
    switch (senderType) {
      case 'visitor':
        return {
          icon: <User className="w-4 h-4" />,
          bgColor: 'bg-gray-600/30',
          textColor: 'text-gray-200',
          align: 'items-start',
        }
      case 'ai':
        return {
          icon: <Bot className="w-4 h-4" />,
          bgColor: 'bg-blue-500/20',
          textColor: 'text-blue-200',
          align: 'items-start',
        }
      case 'admin':
        return {
          icon: <User className="w-4 h-4" />,
          bgColor: 'bg-emerald-500/30',
          textColor: 'text-emerald-200',
          align: 'items-end',
        }
      case 'system':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          bgColor: 'bg-yellow-500/10',
          textColor: 'text-yellow-300',
          align: 'items-center',
        }
      default:
        return {
          icon: <MessageCircle className="w-4 h-4" />,
          bgColor: 'bg-gray-500/20',
          textColor: 'text-gray-300',
          align: 'items-start',
        }
    }
  }

  if (loading) {
    return (
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset className="bg-gradient-to-b from-[#0d121a] via-[#0f141d] to-[#0b1017] min-h-screen admin-body">
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset className="bg-gradient-to-b from-[#0d121a] via-[#0f141d] to-[#0b1017] min-h-screen admin-body">
        <div className="h-[calc(100vh-48px)] flex gap-4 p-4">
          {/* Sessions List */}
          <div className="w-80 flex-shrink-0 rounded-xl overflow-hidden flex flex-col bg-white/5 border border-white/10">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white admin-heading">Conversations</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2 rounded-lg transition-colors ${
                    soundEnabled
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-gray-500 hover:text-gray-400 hover:bg-white/5'
                  }`}
                  title={soundEnabled ? 'Sound alerts on' : 'Sound alerts off'}
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  onClick={fetchSessions}
                  className="p-2 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sessions */}
            <div className="flex-1 overflow-y-auto">
              {sessions.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active conversations</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleSelectSession(session)}
                    className={`w-full p-4 text-left border-b border-white/5 transition-colors ${
                      selectedSession?.id === session.id
                        ? 'bg-emerald-500/20'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/20">
                          <User className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="text-sm font-medium text-white">
                          {session.visitor_name || `Visitor ${session.visitor_id?.slice(0, 8)}`}
                        </span>
                      </div>
                      {session.unread_count > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-medium">
                          {session.unread_count}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      {getStatusBadge(session.status)}
                      <span className="text-xs text-gray-500">
                        {session.last_message_at ? formatTime(session.last_message_at) : 'New'}
                      </span>
                    </div>

                    {session.last_message && (
                      <p className="text-xs text-gray-400 truncate">{session.last_message}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="flex-1 rounded-xl overflow-hidden flex flex-col bg-white/5 border border-white/10">
            {selectedSession ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <User className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">
                        {selectedSession.visitor_name || `Visitor ${selectedSession.visitor_id?.slice(0, 8)}`}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {selectedSession.visitor_email && <span>{selectedSession.visitor_email}</span>}
                        {getStatusBadge(selectedSession.status)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedSession.current_page && (
                      <a
                        href={selectedSession.current_page}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Page
                      </a>
                    )}

                    {selectedSession.status !== 'admin_joined' && (
                      <button
                        onClick={handleTakeover}
                        disabled={takingOver}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        {takingOver ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <PhoneCall className="w-4 h-4" />
                        )}
                        Take Over
                      </button>
                    )}

                    <button
                      onClick={handleCloseSession}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Close chat"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => {
                    const style = getMessageStyle(message.sender_type)
                    const isSystem = message.sender_type === 'system'
                    const isAdmin = message.sender_type === 'admin'

                    return (
                      <div key={message.id} className={`flex flex-col ${style.align}`}>
                        {isSystem ? (
                          <div className={`px-4 py-2 rounded-lg ${style.bgColor} ${style.textColor} text-sm text-center w-full`}>
                            {message.content}
                          </div>
                        ) : (
                          <div className={`max-w-[70%] ${isAdmin ? 'ml-auto' : ''}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={style.textColor}>{style.icon}</span>
                              <span className="text-xs text-gray-500">
                                {message.sender_type === 'admin' && message.admin_name
                                  ? message.admin_name
                                  : message.sender_type === 'ai'
                                  ? 'AI Assistant'
                                  : 'Visitor'}
                              </span>
                              <span className="text-xs text-gray-600">
                                {formatTime(message.created_at)}
                              </span>
                            </div>
                            <div className={`px-4 py-3 rounded-xl ${style.bgColor} ${style.textColor}`}>
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                {selectedSession.status === 'admin_joined' ? (
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 bg-white/5 border border-white/10"
                      />
                      <button
                        type="submit"
                        disabled={sendingMessage || !newMessage.trim()}
                        className="px-4 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingMessage ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 border-t border-white/10 text-center">
                    <p className="text-sm text-gray-500">
                      Click "Take Over" to start responding to this chat
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">Select a conversation</h3>
                  <p className="text-sm text-gray-500">Choose a chat from the list to view messages</p>
                </div>
              </div>
            )}
          </div>

          {/* Notification Modal */}
          {notificationModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
              <div
                className="w-full max-w-md rounded-xl overflow-hidden animate-pulse bg-[#0f1621] border-2 border-emerald-500"
                style={{ boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)' }}
              >
                {/* Header */}
                <div className="p-4 flex items-center gap-3 border-b border-white/10 bg-emerald-500/10">
                  <div className="p-2 rounded-full bg-orange-500/20 animate-bounce">
                    <Bell className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white admin-heading">
                      Team Member Requested!
                    </h2>
                    <p className="text-xs text-gray-400">Someone needs your help</p>
                  </div>
                  <button
                    onClick={() => setNotificationModal(null)}
                    className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-emerald-500/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <User className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {notificationModal.visitor_name || `Visitor ${notificationModal.visitor_id?.slice(0, 8)}`}
                      </p>
                      {notificationModal.visitor_email && (
                        <p className="text-xs text-gray-400">{notificationModal.visitor_email}</p>
                      )}
                    </div>
                  </div>

                  {notificationModal.current_page && (
                    <div className="p-3 rounded-lg bg-white/5">
                      <p className="text-xs text-gray-500 mb-1">Viewing page:</p>
                      <p className="text-sm text-gray-300 truncate">{notificationModal.current_page}</p>
                    </div>
                  )}

                  {notificationModal.last_message && (
                    <div className="p-3 rounded-lg bg-white/5">
                      <p className="text-xs text-gray-500 mb-1">Last message:</p>
                      <p className="text-sm text-gray-300 line-clamp-2">{notificationModal.last_message}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-4 flex items-center gap-3 border-t border-white/10">
                  <button
                    onClick={() => setNotificationModal(null)}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-emerald-500/10 transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => {
                      setNotificationModal(null)
                      handleSelectSession(notificationModal)
                    }}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                  >
                    View Chat
                  </button>
                  <button
                    onClick={() => handleTakeoverFromNotification(notificationModal)}
                    disabled={takingOver}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {takingOver ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <PhoneCall className="w-4 h-4" />
                    )}
                    Take Over
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
