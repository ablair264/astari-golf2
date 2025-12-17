import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Folder,
  FolderOpen,
  Image as ImageIcon,
  Upload,
  ChevronRight,
  Home,
  Trash2,
  Plus,
  RefreshCw,
  X,
  Check,
  Loader2,
  AlertCircle,
  Copy,
  ExternalLink,
  FolderPlus,
  Grid3X3,
  List,
  Link2,
  Search,
  Package,
  CheckSquare,
  Square,
} from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { cn } from '@/lib/utils'

const API_BASE = '/.netlify/functions/image-manager'
const PRODUCTS_API = '/.netlify/functions/products-admin'

const AdminImageManager = () => {
  const [currentPath, setCurrentPath] = useState('product-images/')
  const [folders, setFolders] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [selectedFiles, setSelectedFiles] = useState([])

  // Upload state
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [previewImage, setPreviewImage] = useState(null)

  // Product assignment state
  const [productPickerOpen, setProductPickerOpen] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)

  // Load folder contents
  const loadFolder = useCallback(async (path) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/list?prefix=${encodeURIComponent(path)}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setFolders(data.folders || [])
      setFiles(data.files || [])
      setCurrentPath(path)
      setSelectedFiles([])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFolder(currentPath)
  }, [])

  // Navigate to folder
  const navigateToFolder = (path) => {
    loadFolder(path)
  }

  // Navigate up
  const navigateUp = () => {
    const parts = currentPath.split('/').filter(Boolean)
    if (parts.length > 1) {
      parts.pop()
      loadFolder(parts.join('/') + '/')
    }
  }

  // Breadcrumb navigation
  const breadcrumbs = currentPath.split('/').filter(Boolean)

  // Create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      const folderPath = `${currentPath}${newFolderName.trim()}/`
      const res = await fetch(`${API_BASE}/create-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setCreateFolderModalOpen(false)
      setNewFolderName('')
      loadFolder(currentPath)
    } catch (err) {
      alert('Failed to create folder: ' + err.message)
    }
  }

  // Delete file
  const handleDelete = async (key) => {
    if (!confirm('Delete this file?')) return
    try {
      const res = await fetch(`${API_BASE}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      loadFolder(currentPath)
    } catch (err) {
      alert('Failed to delete: ' + err.message)
    }
  }

  // Copy URL
  const copyUrl = (url) => {
    navigator.clipboard.writeText(url)
  }

  // Toggle file selection
  const toggleFileSelection = (file) => {
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.key === file.key)
      if (isSelected) {
        return prev.filter(f => f.key !== file.key)
      } else {
        return [...prev, file]
      }
    })
  }

  // Select all files
  const selectAllFiles = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles([...files])
    }
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedFiles([])
    setSelectionMode(false)
  }

  // Format file size
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <AdminLayout
      title="Image Manager"
      subtitle="Upload and manage product images in your R2 bucket"
    >
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-1 text-sm">
            <button
              onClick={() => loadFolder('product-images/')}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <Home className="w-4 h-4" />
            </button>
            {breadcrumbs.map((crumb, i) => (
              <div key={i} className="flex items-center">
                <ChevronRight className="w-4 h-4 text-white/30" />
                <button
                  onClick={() => loadFolder(breadcrumbs.slice(0, i + 1).join('/') + '/')}
                  className={cn(
                    "px-2 py-1 rounded-lg transition-colors",
                    i === breadcrumbs.length - 1
                      ? "text-white font-medium"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  )}
                >
                  {crumb}
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Selection mode controls */}
            {selectionMode ? (
              <>
                <button
                  onClick={selectAllFiles}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2 text-sm"
                >
                  {selectedFiles.length === files.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  {selectedFiles.length === files.length ? 'Deselect All' : 'Select All'}
                </button>
                {selectedFiles.length > 0 && (
                  <button
                    onClick={() => setProductPickerOpen(true)}
                    className="px-3 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-400 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Link2 className="w-4 h-4" />
                    Assign to Product ({selectedFiles.length})
                  </button>
                )}
                <button
                  onClick={clearSelection}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2 text-sm"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setSelectionMode(true)}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2 text-sm"
                  title="Select images to assign to products"
                >
                  <CheckSquare className="w-4 h-4" />
                  Select
                </button>
                <button
                  onClick={() => loadFolder(currentPath)}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  title={viewMode === 'grid' ? 'List view' : 'Grid view'}
                >
                  {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setCreateFolderModalOpen(true)}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2 text-sm"
                >
                  <FolderPlus className="w-4 h-4" />
                  New Folder
                </button>
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-400 transition-colors flex items-center gap-2 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Upload Images
                </button>
              </>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-300 bg-red-500/10 px-4 py-3 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Content */}
        <div className="rounded-xl border border-white/10 bg-white/5 min-h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-white/40" />
            </div>
          ) : folders.length === 0 && files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/40">
              <Folder className="w-12 h-12 mb-3 opacity-50" />
              <p>This folder is empty</p>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors text-sm"
              >
                Upload your first image
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Folders */}
              {folders.map((folder) => (
                <button
                  key={folder.path}
                  onClick={() => navigateToFolder(folder.path)}
                  className="group flex flex-col items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
                >
                  <FolderOpen className="w-12 h-12 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm text-white font-medium truncate w-full text-center">
                    {folder.name}
                  </span>
                </button>
              ))}

              {/* Files */}
              {files.map((file) => {
                const isSelected = selectedFiles.some(f => f.key === file.key)
                return (
                  <div
                    key={file.key}
                    onClick={selectionMode ? () => toggleFileSelection(file) : undefined}
                    className={cn(
                      "group relative flex flex-col rounded-xl bg-white/5 hover:bg-white/10 border transition-all overflow-hidden",
                      selectionMode && "cursor-pointer",
                      isSelected ? "border-blue-500 ring-2 ring-blue-500/50" : "border-white/10 hover:border-white/20"
                    )}
                  >
                    {/* Selection checkbox */}
                    {selectionMode && (
                      <div className="absolute top-2 left-2 z-10">
                        <div className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                          isSelected ? "bg-blue-500 border-blue-500" : "border-white/40 bg-black/40"
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    )}

                    {/* Image Preview */}
                    <button
                      onClick={(e) => {
                        if (selectionMode) {
                          e.stopPropagation()
                          toggleFileSelection(file)
                        } else {
                          setPreviewImage(file)
                        }
                      }}
                      className="aspect-square bg-black/20 flex items-center justify-center overflow-hidden"
                    >
                      {file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className={cn(
                            "w-full h-full object-cover transition-transform duration-300",
                            !selectionMode && "group-hover:scale-105"
                          )}
                          loading="lazy"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-white/30" />
                      )}
                    </button>

                    {/* Actions overlay - hide in selection mode */}
                    {!selectionMode && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => copyUrl(file.url)}
                          className="p-1.5 rounded-lg bg-black/60 text-white/80 hover:bg-black/80 hover:text-white transition-colors"
                          title="Copy URL"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(file.key)}
                          className="p-1.5 rounded-lg bg-red-500/60 text-white hover:bg-red-500/80 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* File info */}
                    <div className="p-2">
                      <p className="text-xs text-white font-medium truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[10px] text-white/40">{formatSize(file.size)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* List View */
            <div className="divide-y divide-white/10">
              {/* Folders */}
              {folders.map((folder) => (
                <button
                  key={folder.path}
                  onClick={() => navigateToFolder(folder.path)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <FolderOpen className="w-5 h-5 text-amber-400" />
                  <span className="text-sm text-white font-medium">{folder.name}</span>
                  <ChevronRight className="w-4 h-4 text-white/30 ml-auto" />
                </button>
              ))}

              {/* Files */}
              {files.map((file) => {
                const isSelected = selectedFiles.some(f => f.key === file.key)
                return (
                  <div
                    key={file.key}
                    onClick={selectionMode ? () => toggleFileSelection(file) : undefined}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group",
                      selectionMode && "cursor-pointer",
                      isSelected && "bg-blue-500/10"
                    )}
                  >
                    {/* Selection checkbox */}
                    {selectionMode && (
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
                        isSelected ? "bg-blue-500 border-blue-500" : "border-white/40"
                      )}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    )}
                    <div className="w-10 h-10 rounded-lg bg-black/20 overflow-hidden flex-shrink-0">
                      {file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-white/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{file.name}</p>
                      <p className="text-xs text-white/40">{formatSize(file.size)}</p>
                    </div>
                    {!selectionMode && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => copyUrl(file.url)}
                          className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                          title="Copy URL"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(file.key)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <UploadModal
          currentPath={currentPath}
          onClose={() => setUploadModalOpen(false)}
          onComplete={() => {
            setUploadModalOpen(false)
            loadFolder(currentPath)
          }}
        />
      )}

      {/* Create Folder Modal */}
      {createFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setCreateFolderModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-[#0f1621] border border-white/10 text-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-400" />
                Create Folder
              </h3>
              <button onClick={() => setCreateFolderModalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-white/70">Folder Name</label>
                <input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                  placeholder="e.g. lamkin"
                  autoFocus
                />
                <p className="text-xs text-white/40">
                  Will be created in: {currentPath}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setCreateFolderModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-white/15 text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setPreviewImage(null)}>
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewImage.url}
            alt={previewImage.name}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-lg bg-black/60 backdrop-blur">
            <span className="text-white text-sm">{previewImage.name}</span>
            <button
              onClick={() => copyUrl(previewImage.url)}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Product Picker Modal */}
      {productPickerOpen && (
        <ProductPickerModal
          selectedImages={selectedFiles}
          onClose={() => setProductPickerOpen(false)}
          onComplete={() => {
            setProductPickerOpen(false)
            clearSelection()
          }}
        />
      )}
    </AdminLayout>
  )
}

// Upload Modal Component
const UploadModal = ({ currentPath, onClose, onComplete }) => {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [currentStep, setCurrentStep] = useState('select') // 'select' | 'processing' | 'uploading' | 'complete'
  const [progress, setProgress] = useState({ current: 0, total: 0, currentFile: '' })
  const [results, setResults] = useState([])
  const fileInputRef = useRef(null)
  const dropzoneRef = useRef(null)

  // Convert image to WebP using canvas
  const convertToWebP = async (file, quality = 0.85) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        // Calculate new dimensions (max 2000px on longest side)
        const maxSize = 2000
        let width = img.width
        let height = img.height

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize
            width = maxSize
          } else {
            width = (width / height) * maxSize
            height = maxSize
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to convert image'))
            }
          },
          'image/webp',
          quality
        )
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  // Handle file selection
  const handleFileSelect = (selectedFiles) => {
    const imageFiles = Array.from(selectedFiles).filter(f =>
      f.type.startsWith('image/') || f.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
    )
    setFiles(prev => [...prev, ...imageFiles])
  }

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dropzoneRef.current?.classList.remove('border-emerald-500')
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    dropzoneRef.current?.classList.add('border-emerald-500')
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    dropzoneRef.current?.classList.remove('border-emerald-500')
  }

  // Remove file from list
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Upload all files
  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    setCurrentStep('processing')
    setProgress({ current: 0, total: files.length, currentFile: '' })

    const uploadResults = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setProgress({ current: i + 1, total: files.length, currentFile: file.name })

      try {
        // Step 1: Convert to WebP
        setCurrentStep('processing')
        let blob
        if (file.type === 'image/webp') {
          blob = file
        } else {
          blob = await convertToWebP(file)
        }

        // Step 2: Upload
        setCurrentStep('uploading')
        const filename = file.name.replace(/\.[^/.]+$/, '') + '.webp'
        const base64 = await blobToBase64(blob)

        const res = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename,
            fileData: base64,
            contentType: 'image/webp',
            folder: currentPath
          })
        })

        const data = await res.json()
        if (data.success) {
          uploadResults.push({ file: file.name, success: true, url: data.url })
        } else {
          uploadResults.push({ file: file.name, success: false, error: data.error })
        }
      } catch (err) {
        uploadResults.push({ file: file.name, success: false, error: err.message })
      }
    }

    setResults(uploadResults)
    setCurrentStep('complete')
    setUploading(false)
  }

  // Blob to base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl bg-[#0f1621] border border-white/10 text-white shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-400" />
              Upload Images
            </h3>
            <p className="text-sm text-white/50 mt-0.5">
              Images will be converted to WebP and optimized
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {currentStep === 'select' && (
            <div className="space-y-4">
              {/* Destination */}
              <div className="flex items-center gap-2 text-sm px-3 py-2 bg-white/5 rounded-lg">
                <Folder className="w-4 h-4 text-amber-400" />
                <span className="text-white/60">Uploading to:</span>
                <span className="text-white font-medium">{currentPath}</span>
              </div>

              {/* Dropzone */}
              <div
                ref={dropzoneRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-white/40 hover:bg-white/5 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
                <Upload className="w-10 h-10 text-white/30 mx-auto mb-3" />
                <p className="text-white/70">
                  Drag and drop images here, or <span className="text-emerald-400">browse</span>
                </p>
                <p className="text-sm text-white/40 mt-1">
                  Supports JPG, PNG, GIF, WebP
                </p>
              </div>

              {/* Selected files */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">{files.length} file{files.length !== 1 ? 's' : ''} selected</span>
                    <button
                      onClick={() => setFiles([])}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {files.map((file, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-lg">
                        <ImageIcon className="w-4 h-4 text-white/40 shrink-0" />
                        <span className="text-sm text-white truncate flex-1">{file.name}</span>
                        <span className="text-xs text-white/40 shrink-0">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                        <button
                          onClick={() => removeFile(i)}
                          className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {(currentStep === 'processing' || currentStep === 'uploading') && (
            <div className="py-8 space-y-6">
              {/* Progress steps */}
              <div className="flex items-center justify-center gap-4">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
                  currentStep === 'processing' ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
                )}>
                  {currentStep === 'processing' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Converting
                </div>
                <ChevronRight className="w-4 h-4 text-white/30" />
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
                  currentStep === 'uploading' ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/40"
                )}>
                  {currentStep === 'uploading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Uploading
                </div>
              </div>

              {/* Current file */}
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">
                  {currentStep === 'processing' ? 'Converting to WebP...' : 'Uploading to R2...'}
                </p>
                <p className="text-white font-medium truncate px-8">{progress.currentFile}</p>
              </div>

              {/* Progress bar */}
              <div className="px-8">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
                <p className="text-center text-sm text-white/60 mt-2">
                  {progress.current} of {progress.total}
                </p>
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="py-8 space-y-6">
              {/* Summary */}
              <div className="text-center">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                  failCount === 0 ? "bg-emerald-500/20" : "bg-amber-500/20"
                )}>
                  {failCount === 0 ? (
                    <Check className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-amber-400" />
                  )}
                </div>
                <h4 className="text-xl font-semibold text-white">
                  {failCount === 0 ? 'Upload Complete!' : 'Upload Finished with Errors'}
                </h4>
                <p className="text-white/60 mt-1">
                  {successCount} uploaded successfully{failCount > 0 ? `, ${failCount} failed` : ''}
                </p>
              </div>

              {/* Results */}
              <div className="max-h-48 overflow-y-auto space-y-1">
                {results.map((result, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg",
                      result.success ? "bg-emerald-500/10" : "bg-red-500/10"
                    )}
                  >
                    {result.success ? (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span className="text-sm text-white truncate flex-1">{result.file}</span>
                    {result.success && (
                      <button
                        onClick={() => navigator.clipboard.writeText(result.url)}
                        className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white"
                        title="Copy URL"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-white/10 shrink-0">
          {currentStep === 'select' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-white/15 text-white hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={files.length === 0}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload {files.length > 0 ? `(${files.length})` : ''}
              </button>
            </>
          )}
          {currentStep === 'complete' && (
            <button
              onClick={onComplete}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-400"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Product Picker Modal Component
const ProductPickerModal = ({ selectedImages, onClose, onComplete }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState([])
  const [styleGroups, setStyleGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [assigning, setAssigning] = useState(false)
  const [assignMode, setAssignMode] = useState('main') // 'main' | 'additional'
  const [success, setSuccess] = useState(false)
  const searchTimeoutRef = useRef(null)

  // Search products
  const searchProducts = async (query) => {
    if (!query || query.length < 2) {
      setProducts([])
      setStyleGroups([])
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${PRODUCTS_API}?search=${encodeURIComponent(query)}&limit=50`)
      const data = await res.json()
      if (data.success) {
        // Group by style_no
        const groups = {}
        data.products.forEach(product => {
          const styleNo = product.style_no || product.sku
          if (!groups[styleNo]) {
            groups[styleNo] = {
              style_no: styleNo,
              name: product.name,
              image_url: product.image_url,
              variants: []
            }
          }
          groups[styleNo].variants.push(product)
        })
        setStyleGroups(Object.values(groups))
        setProducts(data.products)
      }
    } catch (err) {
      console.error('Error searching products:', err)
    } finally {
      setLoading(false)
    }
  }

  // Debounced search
  const handleSearchChange = (value) => {
    setSearchQuery(value)
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchProducts(value)
    }, 300)
  }

  // Assign images to product
  const handleAssign = async () => {
    if (!selectedProduct) return

    setAssigning(true)
    try {
      const imageUrls = selectedImages.map(f => f.url)

      // Get current product data
      const productRes = await fetch(`${PRODUCTS_API}/${selectedProduct.id}`)
      const productData = await productRes.json()

      let updateData = {}

      if (assignMode === 'main') {
        // Set first image as main, rest as additional
        updateData.image_url = imageUrls[0]
        if (imageUrls.length > 1) {
          const existingImages = productData.product?.images || []
          updateData.images = [...existingImages, ...imageUrls.slice(1)]
        }
      } else {
        // Add all to additional images
        const existingImages = productData.product?.images || []
        updateData.images = [...existingImages, ...imageUrls]
      }

      const res = await fetch(`${PRODUCTS_API}/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      const data = await res.json()
      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          onComplete()
        }, 1500)
      } else {
        alert('Failed to assign images: ' + data.error)
      }
    } catch (err) {
      alert('Failed to assign images: ' + err.message)
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="w-full max-w-3xl rounded-2xl bg-[#0f1621] border border-white/10 text-white shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Link2 className="w-5 h-5 text-blue-400" />
              Assign Images to Product
            </h3>
            <p className="text-sm text-white/50 mt-0.5">
              {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {success ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <h4 className="text-xl font-semibold text-white">Images Assigned!</h4>
              <p className="text-white/60 mt-1">
                Successfully assigned {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} to {selectedProduct?.name}
              </p>
            </div>
          ) : (
            <>
              {/* Selected Images Preview */}
              <div className="space-y-2">
                <label className="text-sm text-white/70">Selected Images</label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedImages.map((img, i) => (
                    <div key={img.key} className="relative shrink-0">
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-16 h-16 rounded-lg object-cover border border-white/10"
                      />
                      {i === 0 && assignMode === 'main' && (
                        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold bg-blue-500 rounded text-white">
                          MAIN
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Assign Mode */}
              <div className="space-y-2">
                <label className="text-sm text-white/70">How to assign?</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAssignMode('main')}
                    className={cn(
                      "flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all",
                      assignMode === 'main'
                        ? "bg-blue-500/20 border-blue-500 text-blue-300"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    )}
                  >
                    Set as Main Image
                    <span className="block text-xs font-normal mt-0.5 opacity-70">
                      First image becomes main, rest are additional
                    </span>
                  </button>
                  <button
                    onClick={() => setAssignMode('additional')}
                    className={cn(
                      "flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all",
                      assignMode === 'additional'
                        ? "bg-blue-500/20 border-blue-500 text-blue-300"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    )}
                  >
                    Add to Gallery
                    <span className="block text-xs font-normal mt-0.5 opacity-70">
                      All images added as additional gallery images
                    </span>
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm text-white/70">Search Product</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search by name, SKU, or style number..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/60"
                    autoFocus
                  />
                </div>
              </div>

              {/* Results */}
              <div className="space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-white/40" />
                  </div>
                ) : searchQuery.length < 2 ? (
                  <div className="text-center py-8 text-white/40">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>Type at least 2 characters to search</p>
                  </div>
                ) : styleGroups.length === 0 ? (
                  <div className="text-center py-8 text-white/40">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No products found</p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {styleGroups.map((group) => (
                      <button
                        key={group.style_no}
                        onClick={() => setSelectedProduct(group.variants[0])}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                          selectedProduct?.style_no === group.style_no || selectedProduct?.sku === group.style_no
                            ? "bg-blue-500/20 border border-blue-500"
                            : "bg-white/5 border border-transparent hover:bg-white/10"
                        )}
                      >
                        <div className="w-12 h-12 rounded-lg bg-black/20 overflow-hidden flex-shrink-0">
                          {group.image_url ? (
                            <img src={group.image_url} alt={group.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-white/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{group.name}</p>
                          <p className="text-xs text-white/50">
                            {group.style_no} • {group.variants.length} variant{group.variants.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {(selectedProduct?.style_no === group.style_no || selectedProduct?.sku === group.style_no) && (
                          <Check className="w-5 h-5 text-blue-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-white/10 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-white/15 text-white hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedProduct || assigning}
              className="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {assigning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  Assign to Product
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminImageManager
