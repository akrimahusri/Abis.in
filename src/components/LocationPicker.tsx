/**
 * LocationPicker – Komponen reusable untuk memilih pin koordinat lokasi.
 *
 * Props:
 *  - userId      : string | null  → Supabase user id untuk menyimpan koordinat
 *  - onSave      : (lat, lng) => void  → callback setelah simpan
 *  - initialLat  : number | null
 *  - initialLng  : number | null
 *  - onClose     : () => void
 */

import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import { divIcon, type LatLng } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../lib/supabase'
import { Crosshair, Loader2, MapPin, X } from 'lucide-react'

// Default center: Banda Aceh
const DEFAULT_CENTER: [number, number] = [5.5508, 95.3193]

/** Custom pin icon */
const pinIcon = (color = '#d45353') =>
  divIcon({
    className: '',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3));">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44" fill="none">
          <ellipse cx="18" cy="41" rx="8" ry="3" fill="rgba(0,0,0,0.18)"/>
          <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="${color}"/>
          <circle cx="18" cy="18" r="7" fill="white" fill-opacity="0.9"/>
        </svg>
      </div>
    `,
    iconSize: [1, 1],
    iconAnchor: [0, 0],
  })

/** Sub-component: listens for map clicks to update pin position */
function ClickHandler({ onPick }: { onPick: (latlng: LatLng) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng) })
  return null
}

interface LocationPickerProps {
  userId: string | null
  initialLat?: number | null
  initialLng?: number | null
  /** Accent color for the pin (hex). Defaults to #0f4b37 */
  pinColor?: string
  onSave: (lat: number, lng: number) => void
  onClose: () => void
}

export default function LocationPicker({
  userId,
  initialLat,
  initialLng,
  pinColor = '#0f4b37',
  onSave,
  onClose,
}: LocationPickerProps) {
  const hasInitial = initialLat != null && initialLng != null
  const [position, setPosition] = useState<[number, number] | null>(
    hasInitial ? [initialLat!, initialLng!] : null,
  )
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    hasInitial ? [initialLat!, initialLng!] : DEFAULT_CENTER,
  )
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  const handleGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Browser tidak mendukung GPS.')
      return
    }
    setGpsLoading(true)
    setGpsError(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos: [number, number] = [coords.latitude, coords.longitude]
        setPosition(pos)
        setMapCenter(pos)
        setGpsLoading(false)
      },
      (err) => {
        setGpsError(
          err.code === 1
            ? 'Akses lokasi ditolak. Izinkan akses lokasi di browser.'
            : 'Gagal mendapatkan lokasi. Coba lagi.',
        )
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  const handleSave = async () => {
    if (!position) return
    setSaving(true)
    try {
      if (userId) {
        await supabase
          .from('profiles')
          .update({ latitude: position[0], longitude: position[1] })
          .eq('id', userId)
      }
      setSavedOk(true)
      onSave(position[0], position[1])
      setTimeout(onClose, 900)
    } catch {
      /* silent */
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="w-full max-w-lg rounded-[1.5rem] bg-white shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#0f4b37]" />
            <div>
              <h2 className="text-base font-bold text-[#123d32]">Pin Lokasi</h2>
              <p className="text-xs text-gray-400">Klik peta untuk menentukan posisi Anda</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {/* Map */}
        <div className="relative" style={{ height: '340px' }}>
          <MapContainer
            key={`${mapCenter[0]}-${mapCenter[1]}`}
            center={mapCenter}
            zoom={15}
            className="h-full w-full"
            zoomControl
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler onPick={(ll) => setPosition([ll.lat, ll.lng])} />
            {position && (
              <Marker position={position} icon={pinIcon(pinColor)} />
            )}
          </MapContainer>

          {/* GPS button overlay */}
          <button
            type="button"
            onClick={handleGps}
            disabled={gpsLoading}
            className="absolute bottom-3 right-3 z-[1000] flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#0f4b37] shadow-lg border border-gray-200 hover:bg-[#f0faf5] transition disabled:opacity-60"
          >
            {gpsLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Crosshair className="h-3.5 w-3.5" />
            )}
            {gpsLoading ? 'Mencari...' : 'Lokasi Saya'}
          </button>

          {/* No pin hint */}
          {!position && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-[999]">
              <div className="rounded-xl bg-black/60 px-4 py-2 text-center text-xs text-white backdrop-blur-sm">
                Klik di peta untuk memasang pin lokasi Anda
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 space-y-3">
          {/* Coordinates display */}
          {position ? (
            <div className="flex items-center gap-2 rounded-xl bg-[#f0faf5] border border-[#c6e8d8] px-4 py-2.5">
              <MapPin className="h-4 w-4 text-[#0f4b37] shrink-0" />
              <div className="text-xs text-[#0f4b37] font-mono">
                {position[0].toFixed(6)}, {position[1].toFixed(6)}
              </div>
              <button
                type="button"
                onClick={() => setPosition(null)}
                className="ml-auto text-gray-400 hover:text-red-400 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5">
              <MapPin className="h-4 w-4 text-gray-300 shrink-0" />
              <span className="text-xs text-gray-400">Belum ada pin lokasi</span>
            </div>
          )}

          {/* GPS Error */}
          {gpsError && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{gpsError}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!position || saving}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition flex items-center justify-center gap-2 ${
                savedOk
                  ? 'bg-emerald-500'
                  : !position || saving
                  ? 'bg-[#0f4b37]/40 cursor-not-allowed'
                  : 'bg-[#0f4b37] hover:bg-[#0a3628] active:scale-95'
              }`}
            >
              {savedOk ? (
                '✓ Tersimpan'
              ) : saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  Simpan Lokasi
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
