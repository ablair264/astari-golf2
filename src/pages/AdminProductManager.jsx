import ProductManagerLayout from '@/components/admin/ProductManager'
import AdminLayout from '@/components/admin/AdminLayout'

const AdminProductManagerPage = () => {
  return (
    <AdminLayout title="Product Manager" subtitle="Manage products, variants, and margin rules" hideChrome>
      <ProductManagerLayout />
    </AdminLayout>
  )
}

export default AdminProductManagerPage
