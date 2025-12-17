import React, { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Step1Sizing, Step2ClubType, Step3Moisture, Step4Feel, Step5Results } from './StepScreens'
import { MOCK_RESULTS } from './data'

export default function GripSelectorModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isClosing, setIsClosing] = useState(false)
  const [prefs, setPrefs] = useState({})

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1)
      setPrefs({})
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 300)
  }

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(prev => prev + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1)
  }

  const updatePrefs = (newPrefs) => {
    setPrefs(prev => ({ ...prev, ...newPrefs }))
  }

  // Validation for "Next" button state
  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!prefs.handMeasurementRange
      case 2: return !!prefs.clubType
      case 3: return prefs.moistureControl !== undefined
      case 4: return !!prefs.firmness && !!prefs.texture
      default: return true
    }
  }

  if (!isOpen && !isClosing) return null

  const stepLabels = ["Size", "Type", "Conditions", "Feel", "Results"]

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div
        className={`relative w-full max-w-4xl h-[600px] flex flex-col md:flex-row bg-[#0d121a] rounded-[24px] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-white/5 transition-all duration-300 ${
          isClosing ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0'
        }`}
      >
        {/* Left Sidebar: Stepper */}
        <div className="w-full md:w-[280px] bg-[#0a0e16] border-b md:border-b-0 md:border-r border-white/5 p-6 flex flex-col justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 mb-8">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span className="font-bold text-lg tracking-wide text-white">GripSizer</span>
            </div>

            {/* Vertical Stepper (Desktop) */}
            <div className="space-y-6 hidden md:block">
              {[1, 2, 3, 4, 5].map((step) => {
                const isActive = step === currentStep
                const isCompleted = step < currentStep

                return (
                  <div key={step} className="flex items-center gap-3 group">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-300
                        ${isActive ? 'bg-emerald-500 text-white border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : ''}
                        ${isCompleted ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' : ''}
                        ${!isActive && !isCompleted ? 'bg-transparent text-gray-600 border-white/10' : ''}
                      `}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : step}
                    </div>
                    <span className={`text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-500'}`}>
                      {stepLabels[step - 1]}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Mobile Progress Bar */}
            <div className="md:hidden mb-4">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Step {currentStep} of 5</span>
                <span>{Math.round((currentStep / 5) * 100)}%</span>
              </div>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                  style={{ width: `${(currentStep / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="hidden md:block">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <p className="text-xs text-gray-400 italic">"The only part of the club you actually touch is the grip. Make it count."</p>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-grow flex flex-col h-full bg-[#0d121a] relative overflow-hidden">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 z-20 w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white text-gray-400 hover:text-black rounded-full transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content Container */}
          <div className="flex-grow p-6 md:p-10 overflow-y-auto">
            {currentStep === 1 && (
              <Step1Sizing
                value={prefs.handMeasurementRange}
                onChange={(val) => updatePrefs({ handMeasurementRange: val })}
              />
            )}
            {currentStep === 2 && (
              <Step2ClubType
                value={prefs.clubType}
                onChange={(val) => updatePrefs({ clubType: val })}
              />
            )}
            {currentStep === 3 && (
              <Step3Moisture
                value={prefs.moistureControl}
                onChange={(val) => updatePrefs({ moistureControl: val })}
              />
            )}
            {currentStep === 4 && (
              <Step4Feel
                prefs={prefs}
                onUpdate={updatePrefs}
              />
            )}
            {currentStep === 5 && (
              <Step5Results
                results={MOCK_RESULTS}
                onRestart={() => setCurrentStep(1)}
              />
            )}
          </div>

          {/* Navigation Bar (Bottom) */}
          {currentStep < 5 && (
            <div className="px-4 py-3 md:px-8 md:py-3 border-t border-white/5 flex justify-between items-center bg-[#0d121a] shrink-0">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`text-sm font-medium flex items-center gap-1.5 transition-colors
                  ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-white'}
                `}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className={`relative overflow-hidden rounded-full h-9 px-5 flex items-center justify-center gap-1.5 transition-all active:scale-95
                  ${canProceed()
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                <span className="text-xs font-bold tracking-wide uppercase">
                  {currentStep === 4 ? 'See Results' : 'Next Step'}
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
