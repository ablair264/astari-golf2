import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, FolderTree, Image as ImageIcon, GripVertical } from 'lucide-react'
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
import { ImageDropzone } from '@/components/admin/ImageDropzone'

const API_URL = '/.netlify/functions/categories-admin'

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data?.success === false) throw new Error(data.error || res.statusText)
  return data
}

const AdminCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const data = await fetchJSON(API_URL)
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout
      title="Categories"
      subtitle="Manage product categories and their display settings."
    >
      {loading ? (
        <div className="flex justify-center py-12 text-gray-400">Loading...</div>
      ) : (
        <CategoriesTable categories={categories} onRefresh={loadCategories} />
      )}
    </AdminLayout>
  )
}

const CategoriesTable = ({ categories, onRefresh }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleDelete = async (id, name) => {
    if (confirm(`Are you sure you want to delete "${name}"? Products in this category will become uncategorized.`)) {
      try {
        await fetchJSON(`${API_URL}/${id}`, { method: 'DELETE' })
        onRefresh()
      } catch (error) {
        console.error('Error deleting category:', error)
        alert('Failed to delete category')
      }
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setIsEditDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Categories</h2>
          <p className="text-sm text-gray-400">
            {categories.length} categor{categories.length === 1 ? 'y' : 'ies'} configured
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl border-gray-700 bg-[#303843]">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Category</DialogTitle>
              <DialogDescription className="text-gray-400">
                Create a new product category.
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              categories={categories}
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
              <TableHead className="text-gray-300 w-20">Image</TableHead>
              <TableHead className="text-gray-300">Name</TableHead>
              <TableHead className="text-gray-300">Slug</TableHead>
              <TableHead className="text-gray-300">Description</TableHead>
              <TableHead className="text-gray-300 text-center w-20">Order</TableHead>
              <TableHead className="text-right text-gray-300 w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow className="border-gray-700">
                <TableCell colSpan={6} className="py-8 text-center text-gray-400">
                  <FolderTree className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No categories yet. Add your first category to get started.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow
                  key={category.id}
                  className="border-gray-700 hover:bg-[#3a424d]"
                >
                  <TableCell>
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-700 text-gray-500">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-white">
                    {category.name}
                  </TableCell>
                  <TableCell className="text-gray-400 font-mono text-sm">
                    {category.slug}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-gray-300">
                    {category.description || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-gray-700 text-gray-300 text-sm font-medium">
                      {category.display_order || 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                        onClick={() => handleEdit(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                        onClick={() => handleDelete(category.id, category.name)}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl border-gray-700 bg-[#303843]">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Category</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update category details.
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            category={editingCategory}
            categories={categories}
            onSuccess={() => {
              setIsEditDialogOpen(false)
              setEditingCategory(null)
              onRefresh()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

const CategoryForm = ({ category, categories = [], onSuccess }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    image_url: category?.image_url || '',
    parent_id: category?.parent_id || '',
    display_order: category?.display_order || 0,
  })
  const [images, setImages] = useState(category?.image_url ? [category.image_url] : [])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setFormData({
      name: category?.name || '',
      slug: category?.slug || '',
      description: category?.description || '',
      image_url: category?.image_url || '',
      parent_id: category?.parent_id || '',
      display_order: category?.display_order || 0,
    })
    setImages(category?.image_url ? [category.image_url] : [])
  }, [category])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const dataToSave = {
        ...formData,
        image_url: images[0] || '',
        parent_id: formData.parent_id || null,
      }

      if (category) {
        await fetchJSON(`${API_URL}/${category.id}`, {
          method: 'PUT',
          body: JSON.stringify(dataToSave)
        })
      } else {
        await fetchJSON(API_URL, {
          method: 'POST',
          body: JSON.stringify(dataToSave)
        })
      }
      onSuccess()
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Failed to save category')
    } finally {
      setSubmitting(false)
    }
  }

  // Filter out current category from parent options
  const parentOptions = categories.filter(c => c.id !== category?.id)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="categoryName" className="text-xs font-semibold uppercase tracking-wide text-gray-300">
            Category Name *
          </Label>
          <Input
            id="categoryName"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="border-gray-600 bg-[#1e2329] text-white"
            placeholder="e.g. Grips"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="categorySlug" className="text-xs font-semibold uppercase tracking-wide text-gray-300">
            Slug (auto-generated)
          </Label>
          <Input
            id="categorySlug"
            value={formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="border-gray-600 bg-[#1e2329] text-white font-mono"
            placeholder="grips"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="categoryDescription" className="text-xs font-semibold uppercase tracking-wide text-gray-300">
          Description
        </Label>
        <Textarea
          id="categoryDescription"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          className="border-gray-600 bg-[#1e2329] text-white resize-none"
          placeholder="A short description for this category..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="parentCategory" className="text-xs font-semibold uppercase tracking-wide text-gray-300">
            Parent Category (optional)
          </Label>
          <select
            id="parentCategory"
            value={formData.parent_id || ''}
            onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
            className="w-full h-10 rounded-md border border-gray-600 bg-[#1e2329] text-white px-3 text-sm"
          >
            <option value="">No parent (top-level)</option>
            {parentOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="displayOrder" className="text-xs font-semibold uppercase tracking-wide text-gray-300">
            Display Order
          </Label>
          <Input
            id="displayOrder"
            type="number"
            min="0"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
            className="border-gray-600 bg-[#1e2329] text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-gray-300">
          Category Image
        </Label>
        <ImageDropzone
          images={images}
          onImagesChange={setImages}
          maxFiles={1}
          label=""
          brand="categories"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="submit"
          disabled={submitting}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {submitting ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  )
}

export default AdminCategories
