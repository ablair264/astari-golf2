import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { DashboardSidebar } from '@/components/admin/dashboard-sidebar'

const AdminLayout = ({ title, subtitle, children }) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#1e2329] text-white font-light">
        <DashboardSidebar />
        <SidebarInset className="flex-1 bg-[#1e2329]">
          <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-10 bg-[#1e2329] border-b border-gray-700">
              <div className="px-6 py-4">
                <h1 className="text-2xl font-bold">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
                )}
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
