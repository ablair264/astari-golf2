import React, { useState } from 'react'

/* --- STEP 1: SIZING --- */
export const Step1Sizing = ({ value, onChange }) => {
  const [measureInput, setMeasureInput] = useState("")
  const [unit, setUnit] = useState("in")
  const [error, setError] = useState(null)

  const ranges = [
    { id: 'undersize', label: 'Undersize', rangeIn: '< 6.5"', rangeCm: '< 16.5cm', desc: 'Juniors / Small Hands' },
    { id: 'standard', label: 'Standard', rangeIn: '6.5" - 7.5"', rangeCm: '16.5cm - 19cm', desc: 'Most Common' },
    { id: 'midsize', label: 'Midsize', rangeIn: '7.5" - 9.0"', rangeCm: '19cm - 23cm', desc: 'Large Hands' },
    { id: 'jumbo', label: 'Jumbo', rangeIn: '> 9.0"', rangeCm: '> 23cm', desc: 'Extra Large' },
  ]

  const handleInputChange = (e) => {
    const val = e.target.value
    setMeasureInput(val)

    if (val === "") {
      setError(null)
      return
    }

    const num = parseFloat(val)
    if (isNaN(num)) return

    const min = unit === 'in' ? 4 : 10
    const max = unit === 'in' ? 12 : 31

    if (num < 0) {
      setError("Value cannot be negative")
      if (value) onChange("")
      return
    }

    if (num > 0 && num < min) {
      setError(`Value seems too small (min ~${min}${unit})`)
      if (value) onChange("")
      return
    }

    if (num > max) {
      setError(`Value seems too large (max ~${max}${unit})`)
      if (value) onChange("")
      return
    }

    setError(null)
    const inches = unit === 'cm' ? num / 2.54 : num

    let matchId = 'standard'
    if (inches < 6.5) matchId = 'undersize'
    else if (inches < 7.5) matchId = 'standard'
    else if (inches <= 9.0) matchId = 'midsize'
    else matchId = 'jumbo'

    if (matchId !== value) onChange(matchId)
  }

  const toggleUnit = (newUnit) => {
    if (newUnit === unit) return
    if (measureInput) {
      const num = parseFloat(measureInput)
      if (!isNaN(num)) {
        const converted = newUnit === 'in' ? num / 2.54 : num * 2.54
        setMeasureInput(converted.toFixed(1).replace(/\.0$/, ''))
        setError(null)
      }
    }
    setUnit(newUnit)
  }

  const handleSelect = (id) => {
    setMeasureInput("")
    setError(null)
    onChange(id)
  }

  return (
    <div className="animate-fade-in h-full flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h3 className="text-white text-xl font-bold mb-1">Grip Sizing</h3>
          <p className="text-gray-400 text-sm">Measure from your wrist crease to your middle finger tip.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-grow">
        {/* Left Column: Visual Ruler */}
        <div className="w-full lg:w-[40%] bg-[#0f121a] rounded-2xl border border-white/5 relative overflow-hidden flex flex-col items-center justify-between p-6">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />

          {/* Hand Icon */}
          <div className="relative z-10 mt-4 opacity-80">
            <svg className="w-28 h-28 text-white/10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4v12a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 2 0v1h2V3a1 1 0 0 1 2 0v1h2V3a1 1 0 0 1 2 0v1h1a3 3 0 0 1 3 3v1h-1V7a1 1 0 0 0-1-1h-1v1a1 1 0 0 1-2 0V6h-2v1a1 1 0 0 1-2 0V6h-2v1a1 1 0 0 1-2 0V6H7a1 1 0 0 0-1 1v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4h2z"/>
            </svg>
          </div>

          {/* Scale Bar */}
          <div className="w-full relative h-2 bg-white/10 rounded-full mt-8 mb-2">
            <div className="absolute top-0 bottom-0 left-0 w-[25%] border-r border-white/10" />
            <div className="absolute top-0 bottom-0 left-[25%] w-[35%] border-r border-white/10" />
            <div className="absolute top-0 bottom-0 left-[60%] w-[30%] border-r border-white/10" />

            <div className={`absolute top-1/2 -translate-y-1/2 h-4 rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(16,185,129,0.5)]
              ${value === 'undersize' ? 'left-[5%] w-[20%] bg-emerald-500' : ''}
              ${value === 'standard' ? 'left-[25%] w-[35%] bg-emerald-500' : ''}
              ${value === 'midsize' ? 'left-[60%] w-[30%] bg-emerald-500' : ''}
              ${value === 'jumbo' ? 'left-[90%] w-[10%] bg-emerald-500' : ''}
              ${!value ? 'opacity-0' : 'opacity-100'}
            `} />
          </div>

          <div className="flex justify-between w-full text-[10px] uppercase font-mono text-gray-500 px-1">
            <span>Small</span>
            <span>Med</span>
            <span>Lrg</span>
            <span>XL</span>
          </div>

          {value && (
            <div className="mt-4 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-bold uppercase tracking-wider animate-fade-in">
              Result: {ranges.find(r => r.id === value)?.label}
            </div>
          )}
        </div>

        {/* Right Column: Inputs */}
        <div className="w-full lg:w-[60%] flex flex-col gap-6">
          {/* Manual Input */}
          <div className={`bg-[#0a0e16] rounded-xl p-5 border transition-colors duration-200 ${error ? 'border-red-500/30 bg-red-500/5' : 'border-white/5 focus-within:border-white/20'}`}>
            <div className="flex justify-between items-center mb-3">
              <label className={`text-xs font-bold uppercase tracking-wide block ${error ? 'text-red-400' : 'text-gray-300'}`}>
                Enter Hand Measurement
              </label>
              {error && (
                <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded font-bold">
                  {error}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <div className="relative flex-grow">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder={unit === 'in' ? "e.g. 7.2" : "e.g. 18.5"}
                  value={measureInput}
                  onChange={handleInputChange}
                  min="0"
                  onKeyDown={(e) => {
                    if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault()
                  }}
                  className={`w-full h-12 bg-[#0a0e16] border rounded-lg pl-4 pr-4 text-white font-mono text-lg focus:outline-none focus:ring-1 transition-all placeholder:text-gray-600
                    ${error
                      ? 'border-red-500/30 focus:border-red-500 focus:ring-red-500/20 text-red-100'
                      : 'border-white/10 focus:border-emerald-500 focus:ring-emerald-500'
                    }
                  `}
                />
              </div>

              {/* Unit Toggle */}
              <div className="flex bg-[#0a0e16] rounded-lg border border-white/10 p-1 shrink-0">
                <button
                  onClick={() => toggleUnit('in')}
                  className={`px-4 rounded-md text-sm font-bold transition-all ${unit === 'in' ? 'bg-emerald-500 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}
                >
                  IN
                </button>
                <button
                  onClick={() => toggleUnit('cm')}
                  className={`px-4 rounded-md text-sm font-bold transition-all ${unit === 'cm' ? 'bg-emerald-500 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}
                >
                  CM
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-px bg-white/10 flex-grow" />
            <span className="text-xs text-gray-500 uppercase font-bold">Or Select Range</span>
            <div className="h-px bg-white/10 flex-grow" />
          </div>

          {/* Buttons Grid */}
          <div className="grid grid-cols-2 gap-3">
            {ranges.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className={`p-3 rounded-lg border text-left transition-all duration-200
                  ${value === opt.id
                    ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                    : 'bg-[#0a0e16] border-white/5 hover:border-white/20 hover:bg-white/5'
                  }
                `}
              >
                <div className="flex flex-col">
                  <span className={`text-sm font-bold ${value === opt.id ? 'text-white' : 'text-gray-300'}`}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 mt-1 mb-1">
                    {unit === 'in' ? opt.rangeIn : opt.rangeCm}
                  </span>
                  <span className="text-[10px] text-gray-500">{opt.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* --- STEP 2: CLUB TYPE --- */
export const Step2ClubType = ({ value, onChange }) => {
  return (
    <div className="animate-fade-in h-full flex flex-col justify-center">
      <div className="mb-8 text-center">
        <h3 className="text-white text-xl font-bold mb-2">Grip Category</h3>
        <p className="text-gray-400 text-sm">Are you regripping a standard club or a putter?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <button
          onClick={() => onChange('swing')}
          className={`h-64 rounded-2xl border flex flex-col items-center justify-center gap-4 transition-all duration-300 relative overflow-hidden group
            ${value === 'swing'
              ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500'
              : 'bg-[#0a0e16] border-white/5 hover:bg-white/5 hover:border-white/20'
            }
          `}
        >
          <div className={`p-4 rounded-full ${value === 'swing' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white'} transition-colors`}>
            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div className="text-center px-6">
            <h4 className="text-lg font-bold text-white mb-1">Swing Grip</h4>
            <p className="text-xs text-gray-500">Circular profile for drivers, irons, and wedges.</p>
          </div>
        </button>

        <button
          onClick={() => onChange('putter')}
          className={`h-64 rounded-2xl border flex flex-col items-center justify-center gap-4 transition-all duration-300 relative overflow-hidden group
            ${value === 'putter'
              ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500'
              : 'bg-[#0a0e16] border-white/5 hover:bg-white/5 hover:border-white/20'
            }
          `}
        >
          <div className={`p-4 rounded-full ${value === 'putter' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white'} transition-colors`}>
            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <div className="text-center px-6">
            <h4 className="text-lg font-bold text-white mb-1">Putter Grip</h4>
            <p className="text-xs text-gray-500">Flat-sided profile to stabilize wrists during putting.</p>
          </div>
        </button>
      </div>

      <div className="mt-8 text-center text-xs text-gray-500 max-w-lg mx-auto">
        Note: Putter grips with flat sides are not legal for use on other clubs according to the Rules of Golf.
      </div>
    </div>
  )
}

/* --- STEP 3: MOISTURE --- */
export const Step3Moisture = ({ value, onChange }) => {
  return (
    <div className="animate-fade-in h-full flex flex-col justify-center max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h3 className="text-white text-xl font-bold mb-2">Moisture Management</h3>
        <p className="text-gray-400 text-sm">Do you play in humid conditions or tend to have sweaty hands?</p>
      </div>

      <div className="flex flex-col gap-4">
        <button
          onClick={() => onChange(true)}
          className={`p-6 rounded-xl border flex items-center justify-between transition-all duration-200
            ${value === true
              ? 'bg-emerald-500/10 border-emerald-500'
              : 'bg-[#0a0e16] border-white/5 hover:bg-white/5'
            }
          `}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z"/>
              </svg>
            </div>
            <div className="text-left">
              <h4 className="text-white font-bold">Yes, I need extra traction.</h4>
              <p className="text-xs text-gray-500 mt-1">Prioritize corded or hybrid textures that perform when wet.</p>
            </div>
          </div>
          {value === true && (
            <svg className="w-6 h-6 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
          )}
        </button>

        <button
          onClick={() => onChange(false)}
          className={`p-6 rounded-xl border flex items-center justify-between transition-all duration-200
            ${value === false
              ? 'bg-emerald-500/10 border-emerald-500'
              : 'bg-[#0a0e16] border-white/5 hover:bg-white/5'
            }
          `}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/>
              </svg>
            </div>
            <div className="text-left">
              <h4 className="text-white font-bold">No, standard traction is fine.</h4>
              <p className="text-xs text-gray-500 mt-1">Prioritize comfort and tacky surfaces over aggressive textures.</p>
            </div>
          </div>
          {value === false && (
            <svg className="w-6 h-6 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

/* --- STEP 4: FEEL & TEXTURE --- */
export const Step4Feel = ({ prefs, onUpdate }) => {
  return (
    <div className="animate-fade-in h-full flex flex-col gap-8">
      <div>
        <h3 className="text-white text-xl font-bold mb-6">Feel & Feedback</h3>

        {/* Firmness Section */}
        <div className="mb-8">
          <p className="text-gray-300 text-xs font-bold uppercase tracking-wide mb-3">Firmness Level</p>
          <div className="grid grid-cols-3 gap-3">
            {['soft', 'medium', 'firm'].map((level) => (
              <button
                key={level}
                onClick={() => onUpdate({ firmness: level })}
                className={`h-14 rounded-lg border text-sm font-medium capitalize transition-all
                  ${prefs.firmness === level
                    ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-sm'
                    : 'bg-[#0a0e16] border-white/5 text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  }
                `}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {prefs.firmness === 'firm' && "High feedback, precise control. Good for faster swing speeds."}
            {prefs.firmness === 'soft' && "Maximum vibration dampening. Comfortable for arthritis or slower speeds."}
            {prefs.firmness === 'medium' && "A balanced blend of stability and comfort."}
            {!prefs.firmness && "Select a firmness level above."}
          </p>
        </div>

        {/* Texture Section */}
        <div>
          <p className="text-gray-300 text-xs font-bold uppercase tracking-wide mb-3">Surface Texture</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onUpdate({ texture: 'smooth' })}
              className={`p-4 rounded-lg border text-left transition-all
                ${prefs.texture === 'smooth'
                  ? 'bg-emerald-500/10 border-emerald-500'
                  : 'bg-[#0a0e16] border-white/5 hover:bg-white/5'
                }
              `}
            >
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="2"/>
                </svg>
                <span className={`text-sm font-bold ${prefs.texture === 'smooth' ? 'text-white' : 'text-gray-300'}`}>Smooth / Tacky</span>
              </div>
              <p className="text-xs text-gray-500">Minimal pattern, softer feel. High tackiness.</p>
            </button>

            <button
              onClick={() => onUpdate({ texture: 'rough' })}
              className={`p-4 rounded-lg border text-left transition-all
                ${prefs.texture === 'rough'
                  ? 'bg-emerald-500/10 border-emerald-500'
                  : 'bg-[#0a0e16] border-white/5 hover:bg-white/5'
                }
              `}
            >
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/>
                  <circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/>
                  <circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>
                </svg>
                <span className={`text-sm font-bold ${prefs.texture === 'rough' ? 'text-white' : 'text-gray-300'}`}>Rough / Corded</span>
              </div>
              <p className="text-xs text-gray-500">Aggressive pattern for maximum traction.</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* --- STEP 5: RESULTS --- */
export const Step5Results = ({ results, onRestart }) => {
  return (
    <div className="animate-fade-in h-full flex flex-col">
      <div className="text-center mb-6">
        <h3 className="text-white text-2xl font-bold">Your Top Matches</h3>
        <p className="text-gray-400 text-sm mt-1">Based on your sizing and preference profile.</p>
      </div>

      <div className="flex-grow overflow-y-auto pr-2 space-y-4">
        {results.map((product) => (
          <div key={product.id} className="bg-[#0a0e16] rounded-xl border border-white/5 p-4 flex gap-4 hover:border-white/10 transition-colors group">
            <div className="w-24 h-24 shrink-0 bg-black/20 rounded-lg border border-white/5 overflow-hidden">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>

            <div className="flex-grow flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">{product.brand}</p>
                    <h4 className="text-white font-bold text-lg leading-tight">{product.name}</h4>
                  </div>
                  <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded text-emerald-400 text-xs font-bold">
                    {product.matchScore}% Match
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {product.tags.map(tag => (
                    <span key={tag} className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mt-3">
                <span className="text-white font-bold">${product.price.toFixed(2)}</span>
                <button className="text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg transition-colors shadow-lg">
                  Select
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 text-center">
        <button onClick={onRestart} className="text-gray-400 hover:text-white text-sm flex items-center justify-center gap-2 mx-auto transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Start Over
        </button>
      </div>
    </div>
  )
}
