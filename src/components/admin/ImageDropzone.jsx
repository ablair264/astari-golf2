import { useCallback, useState, useRef } from 'react'
import { UploadCloud, X, Loader2, Image as ImageIcon, GripVertical } from 'lucide-react'
import { getSignedUploadUrl, uploadFileToSignedUrl } from '@/services/uploads'

export function ImageDropzone({
  images = [],
  onImagesChange,
  multiple = true,
  maxFiles = 10,
  brand = 'astari',
  label = 'Product Images',
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const handleFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'))
    if (files.length === 0) return

    const remaining = maxFiles - images.length
    if (remaining <= 0) {
      setError(`Maximum ${maxFiles} images allowed`)
      return
    }

    const toUpload = files.slice(0, remaining)
    setUploading(true)
    setError(null)

    const newUrls = []
    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i]
      const fileId = `${Date.now()}-${i}`
      setUploadProgress(prev => ({ ...prev, [fileId]: { name: file.name, progress: 0 } }))

      try {
        const { uploadUrl, publicUrl } = await getSignedUploadUrl(brand, file.name)
        setUploadProgress(prev => ({ ...prev, [fileId]: { ...prev[fileId], progress: 50 } }))

        await uploadFileToSignedUrl(uploadUrl, file)
        setUploadProgress(prev => ({ ...prev, [fileId]: { ...prev[fileId], progress: 100 } }))

        newUrls.push(publicUrl)
      } catch (err) {
        console.error('Upload failed:', err)
        setError(`Failed to upload ${file.name}`)
        setUploadProgress(prev => {
          const copy = { ...prev }
          delete copy[fileId]
          return copy
        })
      }
    }

    if (newUrls.length > 0) {
      onImagesChange([...images, ...newUrls])
    }

    setUploading(false)
    setUploadProgress({})
  }, [images, onImagesChange, maxFiles, brand])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const removeImage = useCallback((index) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }, [images, onImagesChange])

  const moveImage = useCallback((from, to) => {
    const newImages = [...images]
    const [moved] = newImages.splice(from, 1)
    newImages.splice(to, 0, moved)
    onImagesChange(newImages)
  }, [images, onImagesChange])

  const uploadingFiles = Object.entries(uploadProgress)

  return (
    <div className="space-y-3">
      {label && (
        <label className="text-xs font-semibold tracking-wide text-white/70 uppercase">
          {label}
        </label>
      )}

      {/* Drop zone */}
      <div
        className={`relative rounded-xl border-2 border-dashed px-4 py-6 text-center transition-all cursor-pointer ${
          dragOver
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
      >
        <div className="flex flex-col items-center gap-2 text-white/60">
          {uploading ? (
            <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
          ) : (
            <UploadCloud className="h-8 w-8 text-emerald-400" />
          )}
          <div>
            <p className="text-sm">
              {uploading ? 'Uploading...' : (
                <>Drag & drop images, or <span className="text-emerald-400 font-medium">browse</span></>
              )}
            </p>
            <p className="text-xs text-white/40 mt-1">
              {images.length}/{maxFiles} images • PNG, JPG up to 10MB
            </p>
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {/* Upload progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map(([id, { name, progress }]) => (
            <div key={id} className="flex items-center gap-2 text-xs text-white/60">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="w-20 truncate">{name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Image thumbnails */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((url, index) => (
            <div
              key={url}
              className="relative group aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10"
            >
              <img
                src={url}
                alt={`Product image ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
              <div className="hidden w-full h-full items-center justify-center">
                <ImageIcon className="w-6 h-6 text-white/30" />
              </div>

              {/* First image badge */}
              {index === 0 && (
                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-emerald-600/90 rounded text-[10px] font-medium text-white">
                  Main
                </div>
              )}

              {/* Hover overlay with actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      moveImage(index, 0)
                    }}
                    className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs"
                    title="Make main image"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage(index)
                  }}
                  className="p-1.5 rounded-full bg-red-500/80 hover:bg-red-500 text-white"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageDropzone
