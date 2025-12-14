import { useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { Label } from '@/components/ui/label'

const FileDropZone = ({
  id,
  label,
  helperText,
  accept = 'image/*',
  multiple = true,
  onFilesSelected,
}) => {
  const inputRef = useRef(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [fileNames, setFileNames] = useState([])

  const handleFiles = (files) => {
    const selected = Array.from(files || [])
    if (selected.length === 0) return
    setFileNames(selected.map((f) => f.name))
    onFilesSelected?.(selected)
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className="text-xs font-semibold tracking-wide text-gray-300 uppercase">
          {label}
        </Label>
      )}
      <div
        className={`rounded-xl border border-dashed px-4 py-6 text-center text-sm transition ${
          isDragActive ? 'border-blue-500 bg-[#1e2329]' : 'border-gray-600 bg-[#15191f]'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragActive(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setIsDragActive(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragActive(false)
          handleFiles(e.dataTransfer.files)
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
      >
        <div className="flex flex-col items-center gap-2 text-gray-300">
          <UploadCloud className="h-5 w-5 text-blue-400" />
          <p>Drag & drop files, or <span className="text-blue-400">browse</span></p>
          {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
          {fileNames.length > 0 && (
            <p className="text-xs text-gray-400">
              Selected: {fileNames.length > 2 ? `${fileNames.length} files` : fileNames.join(', ')}
            </p>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}

export default FileDropZone
