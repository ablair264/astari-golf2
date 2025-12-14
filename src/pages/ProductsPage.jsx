import Navbar from '@/components/Navbar'
import ProductBrowser from '@/components/product/ProductBrowser'

const ProductsPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <ProductBrowser />
    </div>
  )
}

export default ProductsPage
