import { Link } from 'react-router-dom'
import { ArrowRight, Package2, Tags } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'

const quickLinks = [
  {
    title: 'Manage Products',
    description: 'Add, edit, or remove products from your catalogue.',
    icon: <Package2 className="w-5 h-5 text-blue-400" />,
    href: '/admin/products',
  },
  {
    title: 'Manage Brands',
    description: 'Control brand assets, logos, and descriptions.',
    icon: <Tags className="w-5 h-5 text-amber-400" />,
    href: '/admin/brands',
  },
]

const AdminDashboard = () => {
  return (
    <AdminLayout
      title="Admin Overview"
      subtitle="Use the navigation on the left to manage different areas of the store."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {quickLinks.map((link) => (
          <Link
            key={link.title}
            to={link.href}
            className="group rounded-xl border border-gray-700 bg-[#303843] p-6 transition hover:border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1e2329]">
                  {link.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {link.title}
                  </h3>
                  <p className="text-sm text-gray-400">{link.description}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-500 transition group-hover:text-blue-400" />
            </div>
          </Link>
        ))}
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard
