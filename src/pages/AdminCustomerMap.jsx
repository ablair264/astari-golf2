import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, X, MapPin, Users, Loader2 } from 'lucide-react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { DashboardSidebar } from '@/components/admin/dashboard-sidebar'

const API_BASE = '/.netlify/functions/customers-admin'

// Get API key from environment
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

// UK Regions configuration
const UK_REGIONS = {
  'Scotland': {
    center: { lat: 56.4907, lng: -4.2026 },
    color: '#10b981' // emerald
  },
  'North East': {
    center: { lat: 54.9783, lng: -1.6178 },
    color: '#f59e0b' // amber
  },
  'North West': {
    center: { lat: 53.7632, lng: -2.7044 },
    color: '#3b82f6' // blue
  },
  'Wales': {
    center: { lat: 52.1307, lng: -3.7837 },
    color: '#ef4444' // red
  },
  'Midlands': {
    center: { lat: 52.4862, lng: -1.8904 },
    color: '#8b5cf6' // purple
  },
  'London': {
    center: { lat: 51.5074, lng: -0.1278 },
    color: '#ec4899' // pink
  },
  'South East': {
    center: { lat: 51.2787, lng: 0.5217 },
    color: '#06b6d4' // cyan
  },
  'South West': {
    center: { lat: 50.7772, lng: -3.9997 },
    color: '#84cc16' // lime
  },
  'Ireland': {
    center: { lat: 53.4129, lng: -8.2439 },
    color: '#f97316' // orange
  }
}

const defaultCenter = { lat: 54.5, lng: -4 }

const mapStyles = [
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#1a2332" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#2c3e50" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#34495e" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#34495e" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#34495e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1f2a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#95a5a6" }] }
]

async function fetchJSON(url) {
  const res = await fetch(url)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || res.statusText)
  return data
}

export default function AdminCustomerMap() {
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const [map, setMap] = useState(null)
  const [markers, setMarkers] = useState([])
  const [infoWindow, setInfoWindow] = useState(null)

  const [customers, setCustomers] = useState([])
  const [regionStats, setRegionStats] = useState({})
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = async () => {
      if (!GOOGLE_MAPS_API_KEY) {
        console.warn('Google Maps API key not set. Set VITE_GOOGLE_MAPS_API_KEY in env.')
        setLoading(false)
        return
      }

      if (window.google?.maps) {
        initializeMap()
        return
      }

      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      if (existingScript) {
        existingScript.addEventListener('load', () => initializeMap())
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`
      script.async = true
      script.defer = true
      script.onload = () => initializeMap()
      script.onerror = () => {
        console.error('Failed to load Google Maps API')
        setLoading(false)
      }
      document.head.appendChild(script)
    }

    loadGoogleMaps()
  }, [])

  // Fetch region statistics
  useEffect(() => {
    fetchRegionStats()
  }, [])

  const fetchRegionStats = async () => {
    try {
      const data = await fetchJSON(`${API_BASE}/regions`)
      const stats = {}
      Object.keys(UK_REGIONS).forEach(region => {
        stats[region] = { count: 0, revenue: 0 }
      })
      data.regions?.forEach(r => {
        if (stats[r.region]) {
          stats[r.region] = {
            count: parseInt(r.customer_count) || 0,
            revenue: parseFloat(r.total_revenue) || 0
          }
        }
      })
      setRegionStats(stats)
    } catch (err) {
      console.error('Failed to load region stats:', err)
    }
  }

  // Fetch customers for map
  const fetchCustomers = async (region = null) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (region) params.set('region', region)

      const data = await fetchJSON(`${API_BASE}/map?${params}`)
      setCustomers(data.customers || [])
    } catch (err) {
      console.error('Failed to load customers:', err)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google?.maps) return

    try {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 6,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: mapStyles
      })

      const infoWindowInstance = new window.google.maps.InfoWindow()

      setMap(mapInstance)
      setInfoWindow(infoWindowInstance)
      setMapReady(true)
    } catch (error) {
      console.error('Error initializing map:', error)
      setLoading(false)
    }
  }, [])

  // Initialize markers when map and customers are ready
  useEffect(() => {
    if (mapReady && customers.length > 0 && map) {
      initializeMarkers()
    } else if (mapReady && selectedRegion && customers.length === 0) {
      // Clear markers if no customers in region
      markers.forEach(m => m.setMap(null))
      setMarkers([])
    }
  }, [mapReady, customers, map])

  const initializeMarkers = () => {
    if (!map || !window.google?.maps) return

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null))

    const newMarkers = customers
      .filter(c => c.latitude && c.longitude)
      .map(customer => {
        const marker = new window.google.maps.Marker({
          position: {
            lat: parseFloat(customer.latitude),
            lng: parseFloat(customer.longitude)
          },
          map: map,
          title: customer.display_name,
          icon: getMarkerIcon(customer)
        })

        marker.addListener('click', () => {
          showInfoWindow(customer, marker)
        })

        return marker
      })

    setMarkers(newMarkers)
  }

  const getMarkerIcon = (customer) => {
    const spent = customer.total_spent || 0
    const scale = Math.min(Math.max(spent / 1000, 8), 18)
    const color = spent > 10000 ? '#ef4444' : spent > 5000 ? '#f59e0b' : '#10b981'

    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: scale,
      fillColor: color,
      fillOpacity: 0.8,
      strokeColor: 'white',
      strokeWeight: 2
    }
  }

  const showInfoWindow = (customer, marker) => {
    if (!infoWindow) return

    const content = `
      <div style="padding: 12px; max-width: 280px; font-family: system-ui, sans-serif;">
        <h4 style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937;">${customer.display_name}</h4>
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #6b7280;">${customer.email || 'No email'}</p>
        <p style="margin: 0 0 12px 0; font-size: 13px; color: #6b7280;">${customer.billing_postcode || ''}</p>
        <div style="display: flex; gap: 16px; margin-bottom: 12px;">
          <div>
            <span style="font-size: 11px; color: #9ca3af;">Orders</span>
            <div style="font-size: 14px; font-weight: 600; color: #1f2937;">${customer.order_count || 0}</div>
          </div>
          <div>
            <span style="font-size: 11px; color: #9ca3af;">Total Spent</span>
            <div style="font-size: 14px; font-weight: 600; color: #1f2937;">£${(customer.total_spent || 0).toLocaleString()}</div>
          </div>
        </div>
        <button
          onclick="window.viewCustomer('${customer.id}')"
          style="width: 100%; padding: 8px 12px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;"
        >
          View Customer
        </button>
      </div>
    `

    infoWindow.setContent(content)
    infoWindow.open(map, marker)

    // Set up global function for popup button
    window.viewCustomer = (customerId) => {
      navigate(`/admin/customers/${customerId}`)
    }
  }

  const handleRegionClick = (region) => {
    const isDeselecting = selectedRegion === region

    setSelectedRegion(isDeselecting ? null : region)

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
      setSidebarOpen(false)
    }

    if (map && mapReady) {
      if (isDeselecting) {
        map.panTo(defaultCenter)
        map.setZoom(6)
        // Clear markers
        markers.forEach(m => m.setMap(null))
        setMarkers([])
        setCustomers([])
      } else {
        const regionData = UK_REGIONS[region]
        if (regionData) {
          map.panTo(regionData.center)
          map.setZoom(7)
          fetchCustomers(region)
        }
      }
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const totalCustomers = Object.values(regionStats).reduce((sum, r) => sum + r.count, 0)

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset className="bg-gradient-to-b from-[#0d121a] via-[#0f141d] to-[#0b1017] min-h-screen admin-body">
        <div className="p-6 h-[calc(100vh-48px)] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300 mb-1">Admin</p>
              <h1 className="text-2xl font-bold text-white admin-heading">Customer Map</h1>
              <p className="text-sm text-white/50 mt-1">
                {totalCustomers} customers across {Object.keys(UK_REGIONS).length} regions
              </p>
            </div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg bg-white/10 text-white"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Map Container */}
          <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
            {/* Region Sidebar */}
            <div
              className={`
                ${sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'}
                transition-all duration-300 shrink-0
                md:relative md:block
                absolute md:static inset-y-0 left-0 z-10
              `}
            >
              <div className="h-full rounded-xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/10 shrink-0">
                  <h2 className="text-lg font-semibold text-white admin-heading">UK Regions</h2>
                  <p className="text-xs text-white/50 mt-1">Select a region to view customers</p>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {Object.entries(UK_REGIONS).map(([region, config]) => {
                    const stats = regionStats[region] || { count: 0, revenue: 0 }
                    const isSelected = selectedRegion === region

                    return (
                      <button
                        key={region}
                        onClick={() => handleRegionClick(region)}
                        className={`
                          w-full text-left p-3 rounded-lg transition-all
                          ${isSelected
                            ? 'bg-emerald-500/20 border-emerald-500/50'
                            : 'bg-white/5 hover:bg-white/10 border-transparent'
                          }
                          border
                        `}
                        style={{ borderLeftWidth: 3, borderLeftColor: config.color }}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${isSelected ? 'text-emerald-300' : 'text-white'}`}>
                            {region}
                          </span>
                          {isSelected && (
                            <span className="text-xs text-emerald-400">Selected</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-white/50">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {stats.count}
                          </span>
                          <span>{formatCurrency(stats.revenue)}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="p-4 border-t border-white/10 shrink-0">
                  <p className="text-xs text-white/50 mb-2">Marker size = Total spent</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                      &lt; £5k
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                      £5-10k
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-red-500"></span>
                      &gt; £10k
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="flex-1 rounded-xl border border-white/10 overflow-hidden relative">
              {!GOOGLE_MAPS_API_KEY ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1a2332]">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-white/30 mx-auto mb-3" />
                    <p className="text-white/50">Google Maps API key not configured</p>
                    <p className="text-xs text-white/30 mt-1">Set VITE_GOOGLE_MAPS_API_KEY in your environment</p>
                  </div>
                </div>
              ) : (
                <>
                  <div ref={mapRef} className="w-full h-full" />
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                    </div>
                  )}
                  {!selectedRegion && mapReady && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-black/70 text-white/70 text-sm">
                      Select a region to view customers
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
