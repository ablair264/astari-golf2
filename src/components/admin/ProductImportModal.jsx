import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Package,
  Tags,
  BarChart3,
  X,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Simple progress bar component
function Progress({ value, className = '' }) {
  return (
    <div className={`w-full bg-gray-700 rounded-full overflow-hidden ${className}`}>
      <motion.div
        className="h-full bg-emerald-500"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  )
}

// Simple toggle switch component
function Switch({ checked, onCheckedChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-emerald-500' : 'bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

const STEPS = [
  { id: 1, title: 'Upload', icon: Upload },
  { id: 2, title: 'Analyze', icon: BarChart3 },
  { id: 3, title: 'Configure', icon: Tags },
  { id: 4, title: 'Import', icon: Package },
  { id: 5, title: 'Complete', icon: CheckCircle2 },
]

export function ProductImportModal({ open, onOpenChange, onImportComplete }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [csvFile, setCsvFile] = useState(null)
  const [csvData, setCsvData] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [products, setProducts] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState(null)
  const [error, setError] = useState(null)

  // Configuration options
  const [config, setConfig] = useState({
    isActive: false, // Products disabled by default
    defaultMargin: 0,
    skipExisting: false,
  })

  const fileInputRef = useRef(null)

  // Reset state when modal closes
  const handleOpenChange = (open) => {
    if (!open) {
      setCsvFile(null)
      setCsvData(null)
      setAnalysis(null)
      setProducts([])
      setCurrentStep(1)
      setError(null)
      setImportProgress(0)
      setImportResults(null)
    }
    onOpenChange(open)
  }

  // Handle file drop
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const file = e.dataTransfer?.files?.[0]
    if (file && file.name.endsWith('.csv')) {
      handleFileSelect(file)
    }
  }, [])

  // Handle file selection
  const handleFileSelect = async (file) => {
    setError(null)
    setCsvFile(file)

    try {
      const text = await file.text()
      setCsvData(text)
    } catch (err) {
      setError('Failed to read file: ' + err.message)
    }
  }

  // Analyze CSV
  const handleAnalyze = async () => {
    if (!csvData) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/.netlify/functions/import-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', csvData }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed')
      }

      setAnalysis(data.analysis)
      setProducts(data.products)
      setCurrentStep(2)
    } catch (err) {
      setError('Analysis failed: ' + err.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Import products
  const handleImport = async () => {
    if (!products.length) return

    setIsImporting(true)
    setError(null)
    setImportProgress(0)
    setCurrentStep(4)

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => Math.min(prev + 5, 90))
      }, 500)

      const response = await fetch('/.netlify/functions/import-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import',
          products,
          isActive: config.isActive,
          defaultMargin: config.defaultMargin,
        }),
      })

      clearInterval(progressInterval)
      setImportProgress(100)

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Import failed')
      }

      setImportResults(data.results)
      setCurrentStep(5)

      if (onImportComplete) {
        onImportComplete(data.results)
      }
    } catch (err) {
      setError('Import failed: ' + err.message)
      setCurrentStep(3) // Go back to config
    } finally {
      setIsImporting(false)
    }
  }

  // Navigate between steps
  const goToStep = (step) => {
    if (step < currentStep) {
      setCurrentStep(step)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-hidden bg-[#1e2329] text-white border-gray-700 p-0">
        <DialogHeader className="p-6 pb-4 border-b border-gray-700">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            Import Products
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between py-4 px-6 bg-gray-800/30">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => goToStep(step.id)}
                disabled={step.id > currentStep}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  currentStep === step.id
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : currentStep > step.id
                    ? 'bg-emerald-500/10 text-emerald-500 cursor-pointer hover:bg-emerald-500/20'
                    : 'bg-gray-700/30 text-gray-500'
                }`}
              >
                <step.icon className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
              </button>
              {index < STEPS.length - 1 && (
                <div className={`w-8 md:w-16 h-0.5 mx-2 ${currentStep > step.id ? 'bg-emerald-500' : 'bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 my-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 max-h-[calc(90vh-180px)]">
          <AnimatePresence mode="wait">
            {/* Step 1: Upload */}
            {currentStep === 1 && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                    csvFile
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />

                  {csvFile ? (
                    <div className="space-y-2">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                      <p className="text-lg font-medium text-emerald-400">{csvFile.name}</p>
                      <p className="text-sm text-gray-400">
                        {(csvFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 text-gray-500 mx-auto" />
                      <p className="text-lg font-medium">Drop your CSV file here</p>
                      <p className="text-sm text-gray-400">or click to browse</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleAnalyze}
                    disabled={!csvFile || isAnalyzing}
                    className="bg-emerald-600 hover:bg-emerald-500"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Analyze File
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Analysis Results */}
            {currentStep === 2 && analysis && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    label="Total Products"
                    value={analysis.validProducts}
                    icon={Package}
                    color="emerald"
                  />
                  <StatCard
                    label="Unique Styles"
                    value={analysis.uniqueStyles}
                    icon={Tags}
                    color="blue"
                  />
                  <StatCard
                    label="With Price"
                    value={analysis.withPrice}
                    icon={CheckCircle2}
                    color="green"
                  />
                  <StatCard
                    label="Without Price"
                    value={analysis.withoutPrice}
                    icon={AlertTriangle}
                    color="yellow"
                  />
                </div>

                {/* Categories & Brands */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">Categories</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {analysis.categories.map((cat) => (
                        <div key={cat.name} className="flex justify-between text-sm">
                          <span>{cat.name}</span>
                          <span className="text-gray-400">{cat.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">Brands</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {analysis.brands.map((brand) => (
                        <div key={brand.name} className="flex justify-between text-sm">
                          <span>{brand.name}</span>
                          <span className="text-gray-400">{brand.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Style Group Distribution */}
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Style Group Sizes</h3>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-emerald-400">{analysis.styleGroupSizes.single}</div>
                      <div className="text-xs text-gray-400">Single variant</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">{analysis.styleGroupSizes.small}</div>
                      <div className="text-xs text-gray-400">2-5 variants</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-400">{analysis.styleGroupSizes.medium}</div>
                      <div className="text-xs text-gray-400">6-10 variants</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-400">{analysis.styleGroupSizes.large}</div>
                      <div className="text-xs text-gray-400">11+ variants</div>
                    </div>
                  </div>
                </div>

                {/* Sample Products */}
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Sample Products Preview</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-700">
                          <th className="text-left py-2 px-2">SKU</th>
                          <th className="text-left py-2 px-2">Name</th>
                          <th className="text-left py-2 px-2">Style No</th>
                          <th className="text-left py-2 px-2">Category</th>
                          <th className="text-right py-2 px-2">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.sampleProducts.map((p) => (
                          <tr key={p.sku} className="border-b border-gray-700/50">
                            <td className="py-2 px-2 font-mono text-xs">{p.sku}</td>
                            <td className="py-2 px-2 max-w-[200px] truncate">{p.name}</td>
                            <td className="py-2 px-2 font-mono text-xs text-emerald-400">{p.style_no}</td>
                            <td className="py-2 px-2 text-gray-400">{p.category_name}</td>
                            <td className="py-2 px-2 text-right">
                              {p.price > 0 ? `£${p.price.toFixed(2)}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={() => setCurrentStep(3)} className="bg-emerald-600 hover:bg-emerald-500">
                    Configure Import
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Configuration */}
            {currentStep === 3 && (
              <motion.div
                key="config"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-gray-800/50 rounded-xl p-6 space-y-6">
                  <h3 className="text-lg font-semibold">Import Settings</h3>

                  {/* Active Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Products Active on Import</Label>
                      <p className="text-sm text-gray-400 mt-1">
                        If disabled, products will need to be manually activated in the admin panel
                      </p>
                    </div>
                    <Switch
                      checked={config.isActive}
                      onCheckedChange={(checked) => setConfig({ ...config, isActive: checked })}
                    />
                  </div>

                  <div className="border-t border-gray-700" />

                  {/* Warning about disabled products */}
                  {!config.isActive && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-yellow-300 font-medium">Products will be disabled by default</p>
                        <p className="text-xs text-yellow-300/70 mt-1">
                          {analysis?.validProducts || 0} products will be imported in a disabled state.
                          You can activate them later through the product manager.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Import Summary */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-emerald-400 mb-4">Ready to Import</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Products:</span>
                      <span className="ml-2 font-medium">{analysis?.validProducts || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Styles:</span>
                      <span className="ml-2 font-medium">{analysis?.uniqueStyles || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <span className={`ml-2 font-medium ${config.isActive ? 'text-emerald-400' : 'text-yellow-400'}`}>
                        {config.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Categories:</span>
                      <span className="ml-2 font-medium">{analysis?.categories?.length || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleImport} className="bg-emerald-600 hover:bg-emerald-500">
                    Start Import
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Importing */}
            {currentStep === 4 && (
              <motion.div
                key="importing"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 py-12 text-center"
              >
                <Loader2 className="w-16 h-16 text-emerald-400 mx-auto animate-spin" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Importing Products...</h3>
                  <p className="text-gray-400">Please wait while we import your products</p>
                </div>
                <div className="max-w-md mx-auto">
                  <Progress value={importProgress} className="h-2" />
                  <p className="text-sm text-gray-400 mt-2">{importProgress}% complete</p>
                </div>
              </motion.div>
            )}

            {/* Step 5: Complete */}
            {currentStep === 5 && importResults && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 py-8 text-center"
              >
                <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto" />
                <div>
                  <h3 className="text-2xl font-bold mb-2">Import Complete!</h3>
                  <p className="text-gray-400">Your products have been successfully imported</p>
                </div>

                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                  <div className="bg-emerald-500/10 rounded-xl p-4">
                    <div className="text-3xl font-bold text-emerald-400">{importResults.inserted}</div>
                    <div className="text-sm text-gray-400">New Products</div>
                  </div>
                  <div className="bg-blue-500/10 rounded-xl p-4">
                    <div className="text-3xl font-bold text-blue-400">{importResults.updated}</div>
                    <div className="text-sm text-gray-400">Updated</div>
                  </div>
                  <div className="bg-yellow-500/10 rounded-xl p-4">
                    <div className="text-3xl font-bold text-yellow-400">{importResults.errors}</div>
                    <div className="text-sm text-gray-400">Errors</div>
                  </div>
                </div>

                {importResults.errors > 0 && importResults.errorDetails?.length > 0 && (
                  <div className="text-left bg-red-500/10 border border-red-500/30 rounded-xl p-4 max-w-lg mx-auto">
                    <h4 className="text-sm font-semibold text-red-400 mb-2">Error Details</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {importResults.errorDetails.map((err, i) => (
                        <div key={i} className="text-xs text-red-300">
                          <span className="font-mono">{err.sku}:</span> {err.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={() => handleOpenChange(false)} className="bg-emerald-600 hover:bg-emerald-500">
                  Done
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Stat Card Component
function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    emerald: 'bg-emerald-500/10 text-emerald-400',
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    red: 'bg-red-500/10 text-red-400',
    purple: 'bg-purple-500/10 text-purple-400',
  }

  return (
    <div className={`rounded-xl p-4 ${colors[color] || colors.emerald}`}>
      <Icon className="w-5 h-5 mb-2 opacity-70" />
      <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      <div className="text-xs opacity-70">{label}</div>
    </div>
  )
}

export default ProductImportModal
