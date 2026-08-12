import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Clock3, HelpCircle, Home, LogOut, MapPinned, ShoppingBag, UserRound } from 'lucide-react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { divIcon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../../lib/supabase'
import { signOutUser } from '../../lib/auth'
import { getFoodImageUrl } from '../../lib/storage'
import { buyerContentClass, buyerPageTitleClass, buyerSidebarClass } from './styles'

const sidebarItems = [
  { label: 'Beranda', icon: Home, active: true },
  { label: 'Keranjang', icon: ShoppingBag, active: false },
  { label: 'Riwayat', icon: Clock3, active: false },
  { label: 'Profil', icon: UserRound, active: false }
]

const filters = ['Jarak', 'Jenis Makanan', 'Harga', 'Waktu Ambil'] as const

const filterOptions: Record<(typeof filters)[number], string[]> = {
  Jarak: ['Terdekat', '0 - 2 km', '2 - 5 km', '> 5 km'],
  'Jenis Makanan': ['Semua', 'Makanan Berat', 'Makanan Ringan', 'Minuman'],
  Harga: ['Termurah', 'Rp 0 - Rp 10.000', 'Rp 10.000 - Rp 25.000', 'Di atas Rp 25.000'],
  'Waktu Ambil': ['Sekarang', '30 menit ke depan', 'Hari ini', 'Besok'],
}

type FoodItem = {
  id: number
  title: string
  location: string
  price: number
  amount: string
  image: string
  distanceLabel: string
  foodType: 'Makanan Berat' | 'Makanan Ringan' | 'Minuman' | 'Semua'
  pickupTime: 'Sekarang' | '30 menit ke depan' | 'Hari ini' | 'Besok' | 'Waktu Ambil'
}

type SellerProfile = {
  id: string
  nama_usaha: string | null
  email: string | null
}

type PostingRecord = {
  id: string
  penjual_id: string
  foto_url: string | null
  nama_makanan: string
  jumlah: number
  harga: number
  batas_waktu_ambil: string | null
  lokasi_lat: number | null
  lokasi_lng: number | null
  created_at: string
}

const defaultBuyerCenter: [number, number] = [5.5508, 95.3193]

const fallbackDistanceLabels = ['0 - 2 km', '2 - 5 km', '> 5 km'] as const

function safeNumber(value: number | string | null | undefined) {
  const parsed = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(parsed) ? Number(parsed) : null
}

function calculateDistanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const earthRadiusKm = 6371
  const deltaLat = ((toLat - fromLat) * Math.PI) / 180
  const deltaLng = ((toLng - fromLng) * Math.PI) / 180
  const startLat = (fromLat * Math.PI) / 180
  const endLat = (toLat * Math.PI) / 180

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2) * Math.cos(startLat) * Math.cos(endLat)

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getDistanceLabel(distanceKm: number | null, fallbackIndex: number) {
  if (distanceKm === null) {
    return fallbackDistanceLabels[fallbackIndex % fallbackDistanceLabels.length]
  }

  if (distanceKm < 2) {
    return '0 - 2 km'
  }

  if (distanceKm < 5) {
    return '2 - 5 km'
  }

  return '> 5 km'
}

function getFoodTypeFromTitle(title: string): FoodItem['foodType'] {
  const normalizedTitle = title.toLowerCase()

  if (normalizedTitle.includes('jus') || normalizedTitle.includes('es') || normalizedTitle.includes('minum')) {
    return 'Minuman'
  }

  if (normalizedTitle.includes('tumis') || normalizedTitle.includes('sayur') || normalizedTitle.includes('snack')) {
    return 'Makanan Ringan'
  }

  return 'Makanan Berat'
}

function getPickupTimeLabel(batasWaktuAmbil: string | null, fallbackIndex: number) {
  if (!batasWaktuAmbil) {
    return ['Sekarang', '30 menit ke depan', 'Hari ini', 'Besok'][fallbackIndex % 4] as FoodItem['pickupTime']
  }

  const pickupDate = new Date(batasWaktuAmbil)
  if (Number.isNaN(pickupDate.getTime())) {
    return ['Sekarang', '30 menit ke depan', 'Hari ini', 'Besok'][fallbackIndex % 4] as FoodItem['pickupTime']
  }

  const now = new Date()
  const diffMinutes = Math.round((pickupDate.getTime() - now.getTime()) / 60000)

  if (diffMinutes <= 30) {
    return 'Sekarang'
  }

  if (diffMinutes <= 180) {
    return '30 menit ke depan'
  }

  if (diffMinutes <= 1440) {
    return 'Hari ini'
  }

  return 'Besok'
}

export default function PembeliDashboard() {
  const navigate = useNavigate()
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const mapCenter: [number, number] = [5.5508, 95.3193]
  const [userName, setUserName] = useState('Memuat...')
  const [userRole, setUserRole] = useState('Pembeli Aktif')
  const [openFilter, setOpenFilter] = useState<(typeof filters)[number] | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<Record<(typeof filters)[number], string>>({
    Jarak: 'Jarak',
    'Jenis Makanan': 'Jenis Makanan',
    Harga: 'Harga',
    'Waktu Ambil': 'Waktu Ambil',
  })
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [loadingFoodItems, setLoadingFoodItems] = useState(true)
  const [buyerLocation, setBuyerLocation] = useState<[number, number] | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const { data, error } = await supabase.from('profiles').select('name, role').eq('id', session.user.id).single()

        if (data && !error) {
          setUserName(data.name || session.user.email?.split('@')[0] || 'Pembeli')
          setUserRole(data.role === 'pembeli' ? 'Pembeli Aktif' : data.role || 'Pembeli Aktif')
        } else {
          setUserName(session.user.email?.split('@')[0] || 'Pembeli')
        }
      }
    }

    fetchProfile()
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setBuyerLocation([position.coords.latitude, position.coords.longitude])
      },
      () => {
        setBuyerLocation(null)
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 },
    )
  }, [])

  useEffect(() => {
    const fetchFoodItems = async () => {
      setLoadingFoodItems(true)

      const { data: postings, error: postingError } = await supabase
        .from('postingan_makanan')
        .select('id, penjual_id, foto_url, nama_makanan, jumlah, harga, batas_waktu_ambil, lokasi_lat, lokasi_lng, created_at')
        .neq('status', 'tidak_layak_konsumsi')
        .order('created_at', { ascending: false })

      if (postingError || !postings) {
        setFoodItems([])
        setLoadingFoodItems(false)
        return
      }

      const sellerIds = [...new Set(postings.map((item) => item.penjual_id))]
      let sellerProfiles: SellerProfile[] = []

      if (sellerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nama_usaha, email')
          .in('id', sellerIds)

        sellerProfiles = (profiles ?? []) as SellerProfile[]
      }

      const sellerMap = new Map(sellerProfiles.map((profile) => [profile.id, profile]))

      const mappedFoodItems: FoodItem[] = postings.map((item: PostingRecord, index) => {
        const sellerProfile = sellerMap.get(item.penjual_id)
        const sellerName = sellerProfile?.nama_usaha || sellerProfile?.email?.split('@')[0] || 'Penjual'
        const itemLatitude = safeNumber(item.lokasi_lat)
        const itemLongitude = safeNumber(item.lokasi_lng)
        const currentBuyerLocation = buyerLocation ?? defaultBuyerCenter
        const distanceKm =
          itemLatitude !== null && itemLongitude !== null
            ? calculateDistanceKm(currentBuyerLocation[0], currentBuyerLocation[1], itemLatitude, itemLongitude)
            : null

        return {
          id: index + 1,
          title: item.nama_makanan,
          location: sellerName,
          price: safeNumber(item.harga) ?? 0,
          amount: `${safeNumber(item.jumlah) ?? 1} Porsi`,
          image: item.foto_url ? (item.foto_url.startsWith('http') ? item.foto_url : getFoodImageUrl(item.foto_url)) : 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80',
          distanceLabel: getDistanceLabel(distanceKm, index),
          foodType: getFoodTypeFromTitle(item.nama_makanan),
          pickupTime: getPickupTimeLabel(item.batas_waktu_ambil, index),
        }
      })

      setFoodItems(mappedFoodItems)
      setLoadingFoodItems(false)
    }

    fetchFoodItems()
  }, [buyerLocation])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenFilter(null)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenFilter(null)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const getInitials = useMemo(() => {
    if (userName === 'Memuat...' || !userName) {
      return '?'
    }

    const parts = userName.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }

    return userName.substring(0, 2).toUpperCase()
  }, [userName])

  const marketMarkerIcon = useMemo(() => {
    return divIcon({
      className: 'abis-map-marker',
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;transform:translate(-50%, -100%);">
          <div style="width:18px;height:18px;border-radius:9999px;background:#d74d3b;border:4px solid rgba(255,255,255,0.95);box-shadow:0 8px 20px rgba(215,77,59,0.25);"></div>
          <div style="padding:5px 10px;border-radius:9999px;background:rgba(255,255,255,0.96);color:#123d32;font-size:10px;font-weight:700;box-shadow:0 6px 16px rgba(18,61,50,0.15);white-space:nowrap;">Makananmu</div>
        </div>
      `,
      iconSize: [1, 1],
      iconAnchor: [0, 0],
    })
  }, [])

  const handleLogout = async () => {
    await signOutUser()
    navigate('/auth')
  }

  const handleSidebarNavigate = (label: string) => {
    if (label === 'Keranjang') {
      navigate('/pembeli/keranjang')
      return
    }

    if (label === 'Riwayat') {
      navigate('/pembeli/riwayat')
      return
    }

    if (label === 'Profil') {
      navigate('/pembeli/detail')
    }
  }

  const handleFilterSelect = (filter: (typeof filters)[number], value: string) => {
    setSelectedFilters((prev) => ({ ...prev, [filter]: value }))
    setOpenFilter(null)
  }

  const filteredFoodItems = useMemo(() => {
    return foodItems.filter((item) => {
      const selectedDistance = selectedFilters.Jarak
      const selectedFoodType = selectedFilters['Jenis Makanan']
      const selectedPrice = selectedFilters.Harga
      const selectedPickupTime = selectedFilters['Waktu Ambil']

      const distanceMatches =
        selectedDistance === 'Jarak' ||
        (selectedDistance === 'Terdekat' ? item.distanceLabel === '0 - 2 km' : item.distanceLabel === selectedDistance)
      const foodTypeMatches = selectedFoodType === 'Jenis Makanan' || selectedFoodType === 'Semua' || item.foodType === selectedFoodType

      const priceMatches = (() => {
        if (selectedPrice === 'Harga') {
          return true
        }

        if (selectedPrice === 'Termurah') {
          return item.price <= 10000
        }

        if (selectedPrice === 'Rp 0 - Rp 10.000') {
          return item.price <= 10000
        }

        if (selectedPrice === 'Rp 10.000 - Rp 25.000') {
          return item.price >= 10000 && item.price <= 25000
        }

        if (selectedPrice === 'Di atas Rp 25.000') {
          return item.price > 25000
        }

        return true
      })()

      const pickupMatches = selectedPickupTime === 'Waktu Ambil' || item.pickupTime === selectedPickupTime

      return distanceMatches && foodTypeMatches && priceMatches && pickupMatches
    })
  }, [selectedFilters])

  return (
    <div className="min-h-screen bg-[#123c2f] font-hanken">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className={buyerSidebarClass}>
          <div>
            <div className="flex items-center justify-between px-5 py-4 lg:px-8 lg:py-0">
              <img src="/images/Logo sidebar.png" alt="Abis.in" className="h-12 w-auto object-contain lg:h-16" />
            </div>

            <nav className="flex flex-col gap-2 pb-4 pt-2 lg:pb-0 lg:pt-0">
              {sidebarItems.map(({ label, icon: Icon, active }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleSidebarNavigate(label)}
                  className={`flex items-center gap-3 py-4 font-semibold transition-colors ${
                    active
                      ? 'ml-3 rounded-l-[2rem] bg-[#F8F9EB] pl-5 text-abisGreen lg:ml-6 lg:pl-6'
                      : 'ml-3 rounded-l-[2rem] pl-5 text-white hover:bg-white/5 lg:ml-6 lg:pl-6'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-4 px-5 pb-6 lg:px-8 lg:pb-0">
            <button type="button" className="flex items-center gap-3 py-2 text-left font-semibold text-white transition hover:text-abisOrange">
              <HelpCircle className="h-5 w-5" />
              Bantuan
            </button>
            <button type="button" onClick={handleLogout} className="flex items-center gap-3 py-2 text-left font-semibold text-white transition hover:text-red-400">
              <LogOut className="h-5 w-5" />
              Keluar
            </button>
          </div>
        </aside>

        <div className={buyerContentClass}>
          <header className="flex items-center justify-between px-5 py-6 md:px-8 lg:px-10">
            <div className="flex items-center gap-3">
              <h1 className={`${buyerPageTitleClass} font-bold`}>Jelajah Makanan</h1>
            </div>

            <div className="flex items-center gap-3 rounded-full bg-[#f1efe9] px-3 py-2 shadow-[inset_0_0_0_1px_rgba(18,61,50,0.08)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e7e1d9] text-xs font-bold text-[#123d32]">
                {getInitials}
              </div>
              <div className="text-right">
                <div className="text-[12px] font-semibold text-[#123d32]">{userName}</div>
                <div className="text-[10px] text-[#123d32]/70">{userRole}</div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-5 pb-8 md:px-8 lg:px-10">
            <div ref={dropdownRef} className="mb-6 flex flex-wrap gap-4">
              {filters.map((filter) => {
                const isOpen = openFilter === filter

                return (
                  <div key={filter} className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenFilter((current) => (current === filter ? null : filter))}
                      aria-expanded={isOpen}
                      className="flex items-center gap-3 rounded-full border border-[#1d4134]/25 bg-[#f7f4ee] px-5 py-3 text-[15px] text-[#234b3e] shadow-sm transition hover:bg-[#f2ede2]"
                    >
                      <span>{selectedFilters[filter]}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOpen && (
                      <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 min-w-[220px] overflow-hidden rounded-2xl border border-[#d9ded6] bg-[#fcfaf5] shadow-[0_16px_30px_rgba(20,39,31,0.14)]">
                        {filterOptions[filter].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleFilterSelect(filter, option)}
                            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-[#234b3e] transition hover:bg-[#edf2ea]"
                          >
                            <span>{option}</span>
                            {selectedFilters[filter] === option && <span className="text-xs font-semibold text-[#0d3a2c]">Aktif</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_1fr]">
              <div className="space-y-4">
                {loadingFoodItems ? (
                  <div className="rounded-[26px] border border-dashed border-[#cfd7ca] bg-[#fbf8f0] px-6 py-10 text-center text-[#234b3e]">
                    <p className="text-lg font-semibold">Memuat menu dari akun penjual...</p>
                    <p className="mt-2 text-sm text-[#234b3e]/70">Data makanan sedang diambil langsung dari Supabase.</p>
                  </div>
                ) : filteredFoodItems.length > 0 ? filteredFoodItems.map((item) => (
                  <article
                    key={item.id}
                    className="flex gap-4 rounded-[26px] border border-[#e9e3d8] bg-[#f8f4ee] p-3 shadow-[0_8px_18px_rgba(21,40,32,0.04)]"
                  >
                    <div className="relative min-w-[170px] overflow-hidden rounded-[20px]">
                      <span className="absolute left-2 top-2 z-10 rounded-full bg-[#0d3a2c]/90 px-2.5 py-1 text-[10px] font-bold text-white">
                        {item.amount}
                      </span>
                      <img src={item.image} alt={item.title} className="h-[150px] w-[170px] object-cover" />
                    </div>

                    <div className="flex flex-1 flex-col justify-between py-1">
                      <div>
                        <h2 className="text-[21px] font-bold leading-tight text-[#123d32]">{item.title}</h2>
                        <p className="mt-2 flex items-center gap-1 text-sm text-[#123d32]/70">
                          <MapPinned className="h-4 w-4" />
                          {item.location}
                        </p>
                      </div>

                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-[12px] text-[#123d32]/70">Rp {item.price.toLocaleString('id-ID')}</p>
                          <p className="text-[14px] font-semibold text-[#123d32]">Rp {item.price.toLocaleString('id-ID')}</p>
                        </div>

                        <button
                          type="button"
                          className="rounded-xl bg-[#ee8d16] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(238,141,22,0.25)] transition hover:bg-[#dc7d0a]"
                        >
                          Ambil
                        </button>
                      </div>
                    </div>
                  </article>
                )) : (
                  <div className="rounded-[26px] border border-dashed border-[#cfd7ca] bg-[#fbf8f0] px-6 py-10 text-center text-[#234b3e]">
                    <p className="text-lg font-semibold">Tidak ada makanan yang cocok dengan filter ini.</p>
                    <p className="mt-2 text-sm text-[#234b3e]/70">Coba ubah pilihan Jarak, Jenis Makanan, Harga, atau Waktu Ambil.</p>
                  </div>
                )}
              </div>

              <div className="relative h-[560px] overflow-hidden rounded-[28px] border border-[#dfe5dd] bg-[#dfe7e4] shadow-[0_14px_30px_rgba(20,39,31,0.08)]">
                <MapContainer
                  center={mapCenter}
                  zoom={16}
                  scrollWheelZoom={false}
                  className="h-full w-full"
                  zoomControl={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={mapCenter} icon={marketMarkerIcon}>
                    <Popup>
                      <div className="text-sm font-semibold text-[#123d32]">Lokasi makananmu</div>
                      <div className="text-xs text-[#123d32]/70">Area sekitar Banda Aceh</div>
                    </Popup>
                  </Marker>
                </MapContainer>

                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.15),rgba(255,255,255,0)_45%)]" />

                <div className="absolute bottom-6 right-6 rounded-full bg-white/90 px-3 py-2 text-[10px] font-semibold text-[#123d32] shadow-md backdrop-blur-sm">
                  Peta Lokasi
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
