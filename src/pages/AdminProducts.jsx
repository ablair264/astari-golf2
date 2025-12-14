import AdminLayout from '@/components/admin/AdminLayout'
import ProductManagerLayout from '@/components/admin/ProductManager'

const AdminProducts = () => {
  return (
    <AdminLayout title="Products" subtitle="Manage products, variants, and rules" hideChrome>
      <ProductManagerLayout />
    </AdminLayout>
  )
}

export default AdminProducts
