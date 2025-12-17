import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { DashboardSidebar } from '@/components/admin/dashboard-sidebar'
import { ToggleLeft, ToggleRight, LogOut } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

const AdminLayout = ({ title, subtitle, children }) => {
  const navigate = useNavigate()
  const { logout } = useAdminAuth()
  const [isLiveChatOnline, setIsLiveChatOnline] = useState(false)

  // Fetch LiveChat online status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/.netlify/functions/livechat/status')
        const data = await response.json()
        if (data.success) {
          setIsLiveChatOnline(data.isOnline)
        }
      } catch (error) {
        console.error('Failed to fetch LiveChat status:', error)
      }
    }
    fetchStatus()
  }, [])

  // Toggle LiveChat online status
  const toggleLiveChat = async () => {
    const newStatus = !isLiveChatOnline
    setIsLiveChatOnline(newStatus) // Optimistic update

    try {
      const token = localStorage.getItem('adminToken') || ''
      const response = await fetch('/.netlify/functions/livechat/admin/online', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isOnline: newStatus }),
      })

      const data = await response.json()
      if (!data.success) {
        setIsLiveChatOnline(!newStatus) // Revert on failure
      }
    } catch (error) {
      console.error('Failed to toggle LiveChat status:', error)
      setIsLiveChatOnline(!newStatus) // Revert on error
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#1e2329] text-white font-light">
        <DashboardSidebar />
        <SidebarInset className="flex-1 bg-[#1e2329]">
          <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-10 bg-[#1e2329] border-b border-gray-700">
              <div className="px-6 py-4 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{title}</h1>
                  {subtitle && (
                    <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* LiveChat Toggle */}
                  <button
                    onClick={toggleLiveChat}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      isLiveChatOnline
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30'
                    }`}
                    title={isLiveChatOnline ? 'LiveChat Online' : 'LiveChat Offline'}
                  >
                    {isLiveChatOnline ? (
                      <ToggleRight className="w-5 h-5" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                    <span className="text-sm font-medium hidden sm:inline">
                      {isLiveChatOnline ? 'Online' : 'Offline'}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${isLiveChatOnline ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                  </button>

                  {/* Logout Button */}
                  <button
                    onClick={async () => {
                      await logout()
                      navigate('/admin/login')
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">Logout</span>
                  </button>
                </div>
              </div>
            </header>
            <main className="flex-1 px-6 py-6">{children}</main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

export default AdminLayout
