import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { DashboardSidebar } from '@/components/admin/dashboard-sidebar'
import { ToggleLeft, ToggleRight, LogOut, Menu } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

const AdminHeader = ({ title, subtitle }) => {
  const navigate = useNavigate()
  const { logout } = useAdminAuth()
  const { isMobile, setOpenMobile } = useSidebar()
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
    <header className="sticky top-0 z-10 bg-[#1e2329] border-b border-gray-700">
      <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Mobile menu trigger */}
          {isMobile && (
            <button
              onClick={() => setOpenMobile(true)}
              className="flex-shrink-0 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors md:hidden"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
          )}

          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs md:text-sm text-gray-400 mt-0.5 md:mt-1 truncate hidden sm:block">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {/* LiveChat Toggle */}
          <button
            onClick={toggleLiveChat}
            className={`flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg transition-all text-xs md:text-sm ${
              isLiveChatOnline
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30'
            }`}
            title={isLiveChatOnline ? 'LiveChat Online' : 'LiveChat Offline'}
          >
            {isLiveChatOnline ? (
              <ToggleRight className="w-4 h-4 md:w-5 md:h-5" />
            ) : (
              <ToggleLeft className="w-4 h-4 md:w-5 md:h-5" />
            )}
            <span className="font-medium hidden sm:inline">
              {isLiveChatOnline ? 'Online' : 'Offline'}
            </span>
            <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isLiveChatOnline ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
          </button>

          {/* Logout Button */}
          <button
            onClick={async () => {
              await logout()
              navigate('/admin/login')
            }}
            className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-xs md:text-sm"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="font-medium hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}

const AdminLayout = ({ title, subtitle, children }) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#1e2329] text-white font-light">
        <DashboardSidebar />
        <SidebarInset className="flex-1 bg-[#1e2329]">
          <div className="flex flex-col min-h-screen">
            <AdminHeader title={title} subtitle={subtitle} />
            <main className="flex-1 px-4 md:px-6 py-4 md:py-6 overflow-x-hidden">{children}</main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

export default AdminLayout
