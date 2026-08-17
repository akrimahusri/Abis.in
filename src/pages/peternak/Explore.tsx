import React, { useEffect, useState } from 'react'
import PeternakLayout from '../../layouts/PeternakLayout'
import { Link, useSearchParams } from 'react-router-dom'
import { MapPin, Search, SlidersHorizontal, Filter, Loader2, Package } from 'lucide-react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { divIcon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../../lib/supabase'
import { resolveFoodImageUrl } from '../../lib/storage'

type ExplorePosting = {
  id: string
  penjual_id: string
  nama_makanan: string
  jumlah: number
  foto_url: string | null
  created_at: string
  storeName: string
  storeAddress: string
  latitude: number | null
  longitude: number | null
}

const defaultCenter: [number, number] = [5.5508, 95.3193]

const mapMarkerIcon = divIcon({
  className: 'abis-map-marker',
  html: `
    <div style="display:flex;flex-direction:column;align-items:center;gap:6px;transform:translate(-50%, -100%);">
      <div style="width:18px;height:18px;border-radius:9999px;background:#123d32;border:4px solid rgba(255,255,255,0.95);box-shadow:0 8px 20px rgba(18,61,50,0.25);"></div>
      <div style="padding:5px 10px;border-radius:9999px;background:rgba(255,255,255,0.96);color:#123d32;font-size:10px;font-weight:700;box-shadow:0 6px 16px rgba(18,61,50,0.15);white-space:nowrap;">Pakan Organik</div>
    </div>
  `,
  iconSize: [1, 1],
  iconAnchor: [0, 0],
})

export default function PeternakExplore() {
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [search, setSearch] = useState(initialQuery)
  const [loading, setLoading] = useState(true)
  const [postings, setPostings] = useState<ExplorePosting[]>([])

  useEffect(() => {
    const q = searchParams.get('q')
    if (q !== null) {
      setSearch(q)
    }
  }, [searchParams])

  useEffect(() => {
    const fetchExplorePostings = async () => {
      setLoading(true)
      try {
        const { data: rawPostings, error } = await supabase
          .from('postingan_makanan')
          .select('id, penjual_id, nama_makanan, jumlah, foto_url, created_at, lokasi_lat, lokasi_lng')
          .eq('status', 'tidak_layak_konsumsi')
          .order('created_at', { ascending: false })

        if (!error && rawPostings) {
          const sellerIds = [...new Set(rawPostings.map((p) => p.penjual_id))]
          let sellerMap = new Map<string, { nama_usaha: string; alamat: string }>()

          if (sellerIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, nama_usaha, alamat')
              .in('id', sellerIds)

            if (profiles) {
              profiles.forEach((prof: any) => {
                sellerMap.set(prof.id, {
                  nama_usaha: prof.nama_usaha || prof.name || 'Mitra Usaha',
                  alamat: prof.alamat || 'Banda Aceh',
                })
              })
            }
          }

          const formatted: ExplorePosting[] = rawPostings.map((p) => {
            const seller = sellerMap.get(p.penjual_id) || {
              nama_usaha: 'Mitra Resto/Warteg',
              alamat: 'Banda Aceh',
            }
            return {
              id: p.id,
              penjual_id: p.penjual_id,
              nama_makanan: p.nama_makanan,
              jumlah: p.jumlah || 1,
              foto_url: p.foto_url,
              created_at: p.created_at,
              storeName: seller.nama_usaha,
              storeAddress: seller.alamat,
              latitude: typeof p.lokasi_lat === 'number' ? p.lokasi_lat : null,
              longitude: typeof p.lokasi_lng === 'number' ? p.lokasi_lng : null,
            }
          })
          setPostings(formatted)
        }
      } catch (err) {
        console.warn('Error fetching explore postings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchExplorePostings()
  }, [])

  const filteredPostings = postings.filter(
    (item) =>
      item.nama_makanan.toLowerCase().includes(search.toLowerCase()) ||
      item.storeName.toLowerCase().includes(search.toLowerCase()) ||
      item.storeAddress.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PeternakLayout>
      <div className="space-y-6">
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-3xl font-literata font-bold text-abisGreen">Jelajah Area</h1>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari lokasi atau toko..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-full py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-abisGreen"
              />
            </div>
            <button className="bg-white p-2.5 rounded-full border border-slate-200 text-slate-600 hover:text-abisGreen hover:border-abisGreen transition">
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MAP AREA */}
        <div className="w-full h-72 lg:h-96 bg-slate-200 rounded-[2rem] overflow-hidden relative shadow-sm border border-slate-200 z-0 isolate">
          <MapContainer
            center={defaultCenter}
            zoom={14}
            scrollWheelZoom={false}
            className="h-full w-full"
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredPostings.map((item) => {
              const lat = item.latitude ?? (defaultCenter[0] + (Math.random() - 0.5) * 0.02)
              const lng = item.longitude ?? (defaultCenter[1] + (Math.random() - 0.5) * 0.02)
              return (
                <Marker key={item.id} position={[lat, lng]} icon={mapMarkerIcon}>
                  <Popup>
                    <div className="flex flex-col gap-1 max-w-[200px]">
                      <img src={resolveFoodImageUrl(item.foto_url, 'https://images.unsplash.com/photo-1595858682057-02488bc6ee05?w=200&h=200&fit=crop')} className="w-full h-24 object-cover rounded-lg" alt={item.nama_makanan} />
                      <div className="text-sm font-semibold text-[#123d32]">{item.storeName}</div>
                      <div className="text-xs font-bold text-abisGreen">{item.nama_makanan}</div>
                      <div className="text-xs text-[#123d32]/70">{item.jumlah} Kg/Porsi - {item.storeAddress}</div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
          
          <div className="absolute top-6 right-6 flex flex-col gap-2 z-[400]">
            <button className="bg-white p-3 rounded-full shadow-lg text-slate-700 hover:text-abisGreen font-bold flex items-center justify-center pointer-events-auto">
              <Filter className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg font-bold text-sm text-abisGreen flex items-center gap-2 border border-green-100 z-[400]">
            <MapPin className="w-4 h-4" /> Menampilkan {filteredPostings.length} lokasi sisa makanan terdekat
          </div>
        </div>

        {/* LISTINGS */}
        <div className="pt-4">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Tersedia di Sekitar Anda</h2>

          {loading ? (
            <div className="bg-white rounded-[1.5rem] p-12 text-center border border-slate-100 flex items-center justify-center gap-3 text-abisGreen font-bold">
              <Loader2 className="w-6 h-6 animate-spin" /> Memuat lokasi pakan organik...
            </div>
          ) : filteredPostings.length === 0 ? (
            <div className="bg-white rounded-[1.5rem] p-12 text-center border border-slate-100 text-slate-500">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700">Tidak ada lokasi sisa makanan yang cocok dengan pencarian Anda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredPostings.map((item) => (
                <Link to={`/peternak/detail/${item.id}`} key={item.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition group">
                  <img
                    src={resolveFoodImageUrl(item.foto_url, 'https://images.unsplash.com/photo-1595858682057-02488bc6ee05?w=200&h=200&fit=crop')}
                    alt={item.nama_makanan}
                    className="w-24 h-24 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 leading-tight group-hover:text-abisGreen transition text-lg mb-1 truncate">{item.storeName}</h3>
                    <p className="text-sm text-slate-500 mb-3 truncate">{item.nama_makanan}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-abisOrange bg-orange-50 px-3 py-1 rounded-full">{item.jumlah} Kg/Porsi</span>
                      <span className="flex items-center text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1 rounded-full truncate max-w-[110px]"><MapPin className="w-3 h-3 mr-1 text-slate-400 shrink-0" /> {item.storeAddress}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </PeternakLayout>
  )
}

