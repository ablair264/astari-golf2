import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { DashboardSidebar } from '@/components/admin/dashboard-sidebar'
import ProductManagerLayout from '@/components/admin/ProductManager/ProductManagerLayout'

export default function AdminMargins() {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset className="bg-gradient-to-b from-[#0d121a] via-[#0f141d] to-[#0b1017] min-h-screen admin-body">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300 mb-1">Admin</p>
            <h1 className="text-2xl font-bold text-white admin-heading">Margin Manager</h1>
            <p className="text-sm text-white/50 mt-1">
              Manage margin rules and apply pricing to products
            </p>
          </div>

          {/* Product Manager Layout with Rules Panel - Margin Mode */}
          <ProductManagerLayout pageMode="margins" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
