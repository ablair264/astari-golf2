import React, { useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check,
  Loader2, Sparkles, AlertTriangle, CheckCircle, RefreshCw,
  ChevronDown, Eye, Wand2, Download
} from 'lucide-react'
import * as XLSX from 'xlsx'

const API_BASE = '/.netlify/functions'

// Database columns that can be mapped
const DB_COLUMNS = [
  { key: 'name', label: 'Product Name', required: true },
  { key: 'sku', label: 'SKU', required: true },
  { key: 'price', label: 'Price (Cost)', required: true },
  { key: 'style_no', label: 'Style Number', required: false },
  { key: 'brand_name', label: 'Brand Name', required: false },
  { key: 'category_name', label: 'Category', required: false },
  { key: 'description', label: 'Description', required: false },
  { key: 'image_url', label: 'Image URL', required: false },
  { key: 'colour_name', label: 'Colour Name', required: false },
  { key: 'colour_hex', label: 'Colour Hex', required: false },
  { key: 'stock_quantity', label: 'Stock Quantity', required: false },
  { key: 'material', label: 'Material', required: false },
  { key: 'size', label: 'Size', required: false },
  { key: 'core_size', label: 'Core Size', required: false },
]

// Smart column name matching
const COLUMN_ALIASES = {
  name: ['name', 'product name', 'product_name', 'title', 'product title', 'item name', 'item'],
  sku: ['sku', 'sku code', 'product code', 'code', 'item code', 'article', 'article number', 'barcode'],
  price: ['price', 'cost', 'unit price', 'unit cost', 'rrp', 'retail price', 'wholesale', 'trade price'],
  style_no: ['style', 'style no', 'style_no', 'style number', 'style code', 'model', 'model no'],
  brand_name: ['brand', 'brand name', 'brand_name', 'manufacturer', 'vendor'],
  category_name: ['category', 'category name', 'category_name', 'type', 'product type', 'group'],
  description: ['description', 'desc', 'product description', 'details', 'info', 'about'],
  image_url: ['image', 'image url', 'image_url', 'photo', 'picture', 'img', 'thumbnail'],
  colour_name: ['colour', 'color', 'colour name', 'color name', 'colour_name', 'color_name'],
  colour_hex: ['colour hex', 'color hex', 'hex', 'colour_hex', 'color_hex', 'hex code'],
  stock_quantity: ['stock', 'quantity', 'stock quantity', 'stock_quantity', 'qty', 'inventory', 'available'],
  material: ['material', 'materials', 'fabric', 'composition'],
  size: ['size', 'sizes', 'dimensions'],
  core_size: ['core size', 'core_size', 'grip size'],
}

function autoMapColumns(uploadedColumns) {
  const mapping = {}

  uploadedColumns.forEach((col) => {
    const normalizedCol = col.toLowerCase().trim()

    for (const [dbCol, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.some(alias => normalizedCol === alias || normalizedCol.includes(alias))) {
        if (!mapping[dbCol]) {
          mapping[dbCol] = col
        }
        break
      }
    }
  })

  return mapping
}

export default function ProductUploadModal({ open, onClose, onSuccess }) {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState(null)
  const [rawData, setRawData] = useState([])
  const [columns, setColumns] = useState([])
  const [columnMapping, setColumnMapping] = useState({})
  const [previewData, setPreviewData] = useState([])
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, errors: [] })
  const [generatingDescriptions, setGeneratingDescriptions] = useState(false)
  const [selectedRows, setSelectedRows] = useState(new Set())

  const fileInputRef = useRef(null)

  const resetState = () => {
    setStep(1)
    setFile(null)
    setRawData([])
    setColumns([])
    setColumnMapping({})
    setPreviewData([])
    setImporting(false)
    setImportProgress({ current: 0, total: 0, errors: [] })
    setGeneratingDescriptions(false)
    setSelectedRows(new Set())
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  // Parse uploaded file
  const parseFile = useCallback((uploadedFile) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })

        if (jsonData.length < 2) {
          alert('File must have headers and at least one row of data')
          return
        }

        const headers = jsonData[0].map(h => String(h || '').trim())
        const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== ''))

        setColumns(headers)
        setRawData(rows)
        setFile(uploadedFile)

        // Auto-map columns
        const autoMapping = autoMapColumns(headers)
        setColumnMapping(autoMapping)

        setStep(2)
      } catch (err) {
        console.error('Parse error:', err)
        alert('Failed to parse file. Please ensure it is a valid CSV or XLSX.')
      }
    }

    reader.readAsArrayBuffer(uploadedFile)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      parseFile(droppedFile)
    } else {
      alert('Please upload a CSV or XLSX file')
    }
  }, [parseFile])

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      parseFile(selectedFile)
    }
  }

  // Update column mapping
  const updateMapping = (dbColumn, uploadedColumn) => {
    setColumnMapping(prev => ({
      ...prev,
      [dbColumn]: uploadedColumn || undefined
    }))
  }

  // Generate preview data from mapping
  const generatePreview = () => {
    const mapped = rawData.map((row, idx) => {
      const product = { _rowIndex: idx }

      DB_COLUMNS.forEach(({ key }) => {
        const uploadedCol = columnMapping[key]
        if (uploadedCol) {
          const colIndex = columns.indexOf(uploadedCol)
          product[key] = colIndex >= 0 ? row[colIndex] : ''
        } else {
          product[key] = ''
        }
      })

      // Ensure numeric fields
      product.price = parseFloat(product.price) || 0
      product.stock_quantity = parseInt(product.stock_quantity) || 0

      return product
    })

    setPreviewData(mapped)
    setSelectedRows(new Set(mapped.map((_, i) => i)))
    setStep(3)
  }

  // Check if required columns are mapped
  const requiredColumnsMapped = () => {
    return DB_COLUMNS
      .filter(c => c.required)
      .every(c => columnMapping[c.key])
  }

  // Update preview data
  const updatePreviewRow = (index, field, value) => {
    setPreviewData(prev => prev.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    ))
  }

  // Toggle row selection
  const toggleRowSelection = (index) => {
    setSelectedRows(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  // Select/deselect all rows
  const toggleAllRows = () => {
    if (selectedRows.size === previewData.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(previewData.map((_, i) => i)))
    }
  }

  // Generate AI descriptions for selected products
  const generateDescriptions = async () => {
    const rowsToGenerate = previewData.filter((_, i) => selectedRows.has(i) && !previewData[i].description)

    if (rowsToGenerate.length === 0) {
      alert('No products selected that need descriptions')
      return
    }

    setGeneratingDescriptions(true)

    try {
      // Process in batches of 5
      const batchSize = 5
      for (let i = 0; i < rowsToGenerate.length; i += batchSize) {
        const batch = rowsToGenerate.slice(i, i + batchSize)

        const response = await fetch(`${API_BASE}/generate-descriptions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            products: batch.map(p => ({
              name: p.name,
              brand: p.brand_name,
              category: p.category_name,
              material: p.material,
              colour: p.colour_name,
              size: p.size,
            }))
          })
        })

        const data = await response.json()

        if (data.success && data.descriptions) {
          setPreviewData(prev => {
            const updated = [...prev]
            batch.forEach((product, batchIdx) => {
              const originalIndex = previewData.findIndex(p => p._rowIndex === product._rowIndex)
              if (originalIndex >= 0 && data.descriptions[batchIdx]) {
                updated[originalIndex] = {
                  ...updated[originalIndex],
                  description: data.descriptions[batchIdx]
                }
              }
            })
            return updated
          })
        }
      }
    } catch (err) {
      console.error('Description generation error:', err)
      alert('Failed to generate descriptions. Please check your API configuration.')
    } finally {
      setGeneratingDescriptions(false)
    }
  }

  // Import products
  const importProducts = async () => {
    const productsToImport = previewData.filter((_, i) => selectedRows.has(i))

    if (productsToImport.length === 0) {
      alert('No products selected for import')
      return
    }

    setImporting(true)
    setImportProgress({ current: 0, total: productsToImport.length, errors: [] })
    setStep(4)

    const errors = []

    for (let i = 0; i < productsToImport.length; i++) {
      const product = productsToImport[i]

      try {
        const response = await fetch(`${API_BASE}/products-admin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: product.name,
            sku: product.sku,
            style_no: product.style_no || null,
            price: product.price,
            description: product.description || null,
            image_url: product.image_url || null,
            colour_name: product.colour_name || null,
            colour_hex: product.colour_hex || null,
            stock_quantity: product.stock_quantity || 0,
            material: product.material || null,
            size: product.size || null,
            core_size: product.core_size || null,
            // Brand and category will need to be looked up or created
            brand_name: product.brand_name || null,
            category_name: product.category_name || null,
          })
        })

        const data = await response.json()

        if (!data.success) {
          errors.push({ sku: product.sku, error: data.error || 'Unknown error' })
        }
      } catch (err) {
        errors.push({ sku: product.sku, error: err.message })
      }

      setImportProgress(prev => ({ ...prev, current: i + 1, errors }))
    }

    setImporting(false)

    if (errors.length === 0) {
      setTimeout(() => {
        onSuccess?.()
        handleClose()
      }, 1500)
    }
  }

  // Download template
  const downloadTemplate = () => {
    const template = [
      ['name', 'sku', 'price', 'style_no', 'brand_name', 'category_name', 'description', 'image_url', 'colour_name', 'colour_hex', 'stock_quantity', 'material', 'size'],
      ['Example Golf Grip', 'GRIP-001', '12.99', 'GRP100', 'Golf Pride', 'Grips', 'Premium rubber golf grip', 'https://example.com/grip.jpg', 'Black', '#000000', '100', 'Rubber', 'Standard'],
    ]

    const ws = XLSX.utils.aoa_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Products')
    XLSX.writeFile(wb, 'product_upload_template.xlsx')
  }

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="w-full max-w-5xl max-h-[90vh] bg-[#1e2329] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Upload className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Import Products</h3>
              <p className="text-sm text-white/50">Step {step} of 4</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between">
            {['Upload File', 'Map Columns', 'Preview & AI', 'Import'].map((label, idx) => (
              <div key={label} className="flex items-center">
                <div className={`flex items-center gap-2 ${step > idx + 1 ? 'text-emerald-400' : step === idx + 1 ? 'text-white' : 'text-white/40'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step > idx + 1 ? 'bg-emerald-500 text-white' :
                    step === idx + 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500' :
                    'bg-white/10 text-white/40'
                  }`}>
                    {step > idx + 1 ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">{label}</span>
                </div>
                {idx < 3 && (
                  <div className={`w-12 h-0.5 mx-2 ${step > idx + 1 ? 'bg-emerald-500' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-6">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 rounded-2xl p-12 text-center hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-white/40" />
                <h4 className="text-xl font-semibold text-white mb-2">
                  Drop your file here
                </h4>
                <p className="text-white/60 mb-4">
                  or click to browse
                </p>
                <p className="text-sm text-white/40">
                  Supports CSV, XLSX, XLS files
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-white">Map Your Columns</h4>
                  <p className="text-sm text-white/60">
                    Match your file columns to our database fields. We've auto-detected what we could.
                  </p>
                </div>
                <div className="text-sm text-white/50">
                  {rawData.length} rows found
                </div>
              </div>

              <div className="grid gap-3">
                {DB_COLUMNS.map(({ key, label, required }) => (
                  <div key={key} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="w-48 flex items-center gap-2">
                      <span className="text-white font-medium">{label}</span>
                      {required && <span className="text-red-400 text-xs">*</span>}
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/40" />
                    <select
                      value={columnMapping[key] || ''}
                      onChange={(e) => updateMapping(key, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-[#1a1f26] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 [&>option]:bg-[#1a1f26] [&>option]:text-white"
                    >
                      <option value="">-- Select column --</option>
                      {columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    {columnMapping[key] && (
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              {!requiredColumnsMapped() && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Please map all required fields (Name, SKU, Price) to continue
                </div>
              )}
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-white">Preview & Generate Descriptions</h4>
                  <p className="text-sm text-white/60">
                    Review your data and use AI to generate product descriptions
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={generateDescriptions}
                    disabled={generatingDescriptions || selectedRows.size === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingDescriptions ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Generate Descriptions ({selectedRows.size})
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="overflow-auto rounded-xl border border-white/10 max-h-[400px]">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">
                        <input
                          type="checkbox"
                          checked={selectedRows.size === previewData.length}
                          onChange={toggleAllRows}
                          className="accent-emerald-500"
                        />
                      </th>
                      <th className="px-3 py-2 text-left text-white/60 font-medium">Name</th>
                      <th className="px-3 py-2 text-left text-white/60 font-medium">SKU</th>
                      <th className="px-3 py-2 text-left text-white/60 font-medium">Price</th>
                      <th className="px-3 py-2 text-left text-white/60 font-medium">Brand</th>
                      <th className="px-3 py-2 text-left text-white/60 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {previewData.map((row, idx) => (
                      <tr key={idx} className={`${selectedRows.has(idx) ? 'bg-emerald-500/10' : ''} hover:bg-white/5`}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(idx)}
                            onChange={() => toggleRowSelection(idx)}
                            className="accent-emerald-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={row.name || ''}
                            onChange={(e) => updatePreviewRow(idx, 'name', e.target.value)}
                            className="w-full bg-transparent text-white border-none focus:outline-none focus:bg-white/10 rounded px-1"
                          />
                        </td>
                        <td className="px-3 py-2 text-white/70">{row.sku}</td>
                        <td className="px-3 py-2 text-white/70">£{row.price?.toFixed(2)}</td>
                        <td className="px-3 py-2 text-white/70">{row.brand_name || '-'}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <input
                              value={row.description || ''}
                              onChange={(e) => updatePreviewRow(idx, 'description', e.target.value)}
                              placeholder={generatingDescriptions ? 'Generating...' : 'No description'}
                              className="flex-1 bg-transparent text-white/70 border-none focus:outline-none focus:bg-white/10 rounded px-1 placeholder:text-white/30"
                            />
                            {row.description && (
                              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-sm text-white/50">
                {selectedRows.size} of {previewData.length} products selected for import
              </div>
            </div>
          )}

          {/* Step 4: Import Progress */}
          {step === 4 && (
            <div className="space-y-6 py-8">
              <div className="text-center">
                {importing ? (
                  <>
                    <Loader2 className="w-16 h-16 mx-auto mb-4 text-emerald-400 animate-spin" />
                    <h4 className="text-xl font-semibold text-white mb-2">
                      Importing Products...
                    </h4>
                    <p className="text-white/60">
                      {importProgress.current} of {importProgress.total} products imported
                    </p>
                  </>
                ) : importProgress.errors.length === 0 ? (
                  <>
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
                    <h4 className="text-xl font-semibold text-white mb-2">
                      Import Complete!
                    </h4>
                    <p className="text-white/60">
                      Successfully imported {importProgress.total} products
                    </p>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                    <h4 className="text-xl font-semibold text-white mb-2">
                      Import Completed with Errors
                    </h4>
                    <p className="text-white/60 mb-4">
                      {importProgress.total - importProgress.errors.length} of {importProgress.total} products imported successfully
                    </p>
                  </>
                )}
              </div>

              {/* Progress bar */}
              <div className="max-w-md mx-auto">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                  />
                </div>
              </div>

              {/* Errors */}
              {importProgress.errors.length > 0 && (
                <div className="max-w-md mx-auto mt-6">
                  <h5 className="text-sm font-semibold text-white/70 mb-2">Errors:</h5>
                  <div className="space-y-2 max-h-40 overflow-auto">
                    {importProgress.errors.map((err, idx) => (
                      <div key={idx} className="p-2 rounded bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                        <strong>{err.sku}:</strong> {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 shrink-0">
          <button
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1 || step === 4}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                onClick={generatePreview}
                disabled={!requiredColumnsMapped()}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={importProducts}
                disabled={selectedRows.size === 0 || generatingDescriptions}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import {selectedRows.size} Products
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 4 && !importing && (
              <button
                onClick={handleClose}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-all"
              >
                Done
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
