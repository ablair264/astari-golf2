import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  getAllBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} from '@/services/brands'
import FileDropZone from '@/components/admin/FileDropZone'

const AdminBrands = () => {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBrands()
  }, [])

  const loadBrands = async () => {
    setLoading(true)
    try {
      const brandsData = await getAllBrands()
      setBrands(brandsData)
    } catch (error) {
      console.error('Error loading brands:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout
      title="Brands"
      subtitle="Keep brand assets, colours, and descriptions aligned."
    >
      {loading ? (
        <div className="flex justify-center py-12 text-gray-400">Loading...</div>
      ) : (
        <BrandsTable brands={brands} onRefresh={loadBrands} />
      )}
    </AdminLayout>
  )
}

const BrandsTable = ({ brands, onRefresh }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState(null)

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this brand?')) {
      try {
        await deleteBrand(id)
        onRefresh()
      } catch (error) {
        console.error('Error deleting brand:', error)
        alert('Failed to delete brand')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Brands</h2>
          <p className="text-sm text-gray-400">
            {brands.length} brand{brands.length === 1 ? '' : 's'} available to assign
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Brand
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl border-gray-700 bg-[#303843]">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Brand</DialogTitle>
              <DialogDescription className="text-gray-400">
                Create a new brand with images and details.
              </DialogDescription>
            </DialogHeader>
            <BrandForm
              onSuccess={() => {
                setIsAddDialogOpen(false)
                onRefresh()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-700 bg-[#303843]">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700 hover:bg-transparent">
              <TableHead className="text-gray-300">Logo</TableHead>
              <TableHead className="text-gray-300">Name</TableHead>
              <TableHead className="text-gray-300">Description</TableHead>
              <TableHead className="text-right text-gray-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.length === 0 ? (
              <TableRow className="border-gray-700">
                <TableCell colSpan={4} className="py-8 text-center text-gray-400">
                  No brands yet. Add your first brand to get started.
                </TableCell>
              </TableRow>
            ) : (
              brands.map((brand) => (
                <TableRow
                  key={brand.id}
                  className="border-gray-700 hover:bg-[#3a424d]"
                >
                  <TableCell>
                    {brand.images && brand.images[0] ? (
                      <img
                        src={brand.images[0]}
                        alt={brand.name}
                        className="h-16 w-16 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-700 text-gray-400">
                        No logo
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-white">
                    {brand.name}
                  </TableCell>
                  <TableCell className="max-w-md truncate text-gray-300">
                    {brand.description}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                            onClick={() => setEditingBrand(brand)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl border-gray-700 bg-[#303843]">
                          <DialogHeader>
                            <DialogTitle className="text-white">Edit Brand</DialogTitle>
                            <DialogDescription className="text-gray-400">
                              Update brand details and images.
                            </DialogDescription>
                          </DialogHeader>
                          <BrandForm
                            brand={editingBrand}
                            onSuccess={() => {
                              setEditingBrand(null)
                              onRefresh()
                            }}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                        onClick={() => handleDelete(brand.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

const BrandForm = ({ brand, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: brand?.name || '',
    description: brand?.description || '',
    tagline: brand?.tagline || '',
    color: brand?.color || '#303843',
    images: brand?.images || [],
  })
  const [imageFiles, setImageFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setFormData({
      name: brand?.name || '',
      description: brand?.description || '',
      tagline: brand?.tagline || '',
      color: brand?.color || '#303843',
      images: brand?.images || [],
    })
    setImageFiles([])
  }, [brand])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (brand) {
        await updateBrand(brand.id, formData, imageFiles)
      } else {
        await createBrand(formData, imageFiles)
      }
      onSuccess()
    } catch (error) {
      console.error('Error saving brand:', error)
      alert('Failed to save brand')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="brandName" className="text-xs font-semibold uppercase tracking-wide text-gray-300">
          Brand Name
        </Label>
        <Input
          id="brandName"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="border-gray-600 bg-[#1e2329] text-white"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="tagline" className="text-xs font-semibold uppercase tracking-wide text-gray-300">
          Tagline
        </Label>
        <Input
          id="tagline"
          value={formData.tagline}
          onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
          className="border-gray-600 bg-[#1e2329] text-white"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="brandDescription" className="text-xs font-semibold uppercase tracking-wide text-gray-300">
          Description
        </Label>
        <Textarea
          id="brandDescription"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
          className="border-gray-600 bg-[#1e2329] text-white"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="color" className="text-xs font-semibold uppercase tracking-wide text-gray-300">
          Brand Color
        </Label>
        <div className="flex gap-2">
          <Input
            id="color"
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="h-10 w-20 border-gray-600 bg-[#1e2329] p-1"
          />
          <Input
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            placeholder="#303843"
            className="flex-1 border-gray-600 bg-[#1e2329] text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <FileDropZone
          id="brandImages"
          label="Brand Images"
          helperText="Drop brand logos or lifestyle assets (PNG/JPG)."
          onFilesSelected={(files) => setImageFiles(files)}
        />
        {imageFiles.length > 0 && (
          <p className="text-sm text-gray-400">
            {imageFiles.length} file(s) ready to upload
          </p>
        )}
        {formData.images && formData.images.length > 0 && (
          <div className="mt-2 grid grid-cols-4 gap-2">
            {formData.images.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`Brand image ${idx + 1}`}
                className="h-20 w-full rounded object-cover"
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {submitting ? 'Saving...' : brand ? 'Update Brand' : 'Create Brand'}
        </Button>
      </div>
    </form>
  )
}

export default AdminBrands
