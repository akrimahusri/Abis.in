import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Check,
  ChevronDown,
  Clock3,
  HelpCircle,
  Home,
  LogOut,
  MapPinned,
  MessageCircle,
  MessageSquare,
  Send,
  ShoppingBag,
  UserRound,
  X,
  Tag,
} from 'lucide-react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { divIcon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../../lib/supabase'
import { signOutUser } from '../../lib/auth'
import { getFoodImageUrl, resolveFoodImageUrl, DEFAULT_FOOD_IMAGE } from '../../lib/storage'
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
  postingId: string
  title: string
  location: string
  price: number
  amount: string
  stock: number
  status: string
  image: string
  distanceLabel: string
  foodType: 'Makanan Berat' | 'Makanan Ringan' | 'Minuman' | 'Semua'
  pickupTime: 'Sekarang' | '30 menit ke depan' | 'Hari ini' | 'Besok' | 'Waktu Ambil'
  latitude: number | null
  longitude: number | null
}

type SellerProfile = {
  id: string
  nama_usaha: string | null
  email: string | null
}

type SellerChat = {
  id: string
  sellerName: string
  avatar: string
  lastMessage: string
  time: string
  unread: boolean
  messages: { sender: 'buyer' | 'seller'; text: string; time: string }[]
}

type BuyerNotification = {
  id: string
  title: string
  message: string
  time: string
  type: 'chat' | 'order' | 'promo'
  unread: boolean
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
  status?: string | null
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
  const messageRef = useRef<HTMLDivElement | null>(null)
  const notifRef = useRef<HTMLDivElement | null>(null)

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

  // Chat & Notification Popover / Modal States
  const [showMessageDropdown, setShowMessageDropdown] = useState(false)
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const [activeChat, setActiveChat] = useState<SellerChat | null>(null)
  const [buyerChatText, setBuyerChatText] = useState('')

  // Chat List State (persisted to localStorage)
  const [chats, setChats] = useState<SellerChat[]>(() => {
    try {
      const stored = localStorage.getItem('abis_global_chats') || localStorage.getItem('abis_buyer_chats')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any) => ({
            id: item.id || `chat-${Date.now()}`,
            sellerName: item.sellerName || item.buyerName || 'Penjual',
            avatar: item.avatar || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=120&h=120&fit=crop',
            lastMessage: item.lastMessage || '',
            time: item.time || 'Baru saja',
            unread: item.unreadForBuyer ?? item.unread ?? false,
            messages: item.messages || [],
          }))
        }
      }
    } catch (e) {}
    return []
  })

  // Notifications State (persisted to localStorage)
  const [notifications, setNotifications] = useState<BuyerNotification[]>(() => {
    try {
      const stored = localStorage.getItem('abis_buyer_notifs')
      if (stored) return JSON.parse(stored)
    } catch (e) {}
    return [
      {
        id: 'notif-buyer-1',
        title: 'Pesanan Makanan Dikonfirmasi',
        message: 'Warung Berkah Surplus menyetujui pesanan Nasi Ayam Surplus Anda. Silakan ambil sebelum jam 18:00 WIB.',
        time: '15 menit lalu',
        type: 'order',
        unread: true,
      },
      {
        id: 'notif-buyer-2',
        title: 'Pesanan Siap Diambil',
        message: 'Pesanan 2 porsi Tumis Sayur Organik Anda di Rumah Makan Nasi Gurih telah dikemas dan siap dijemput.',
        time: '45 menit lalu',
        type: 'order',
        unread: true,
      },
      {
        id: 'notif-buyer-3',
        title: 'Update Menu Surplus Hemat 50%',
        message: 'Resto Ayam Penyet Syiah Kuala baru saja menambahkan 5 porsi Nasi Goreng Surplus diskon 50%!',
        time: '2 jam lalu',
        type: 'promo',
        unread: false,
      },
      {
        id: 'notif-buyer-4',
        title: 'Balasan Chat dari Penjual',
        message: 'Warung Berkah Surplus: "Halo kak! Makanan masih hangat dan siap dijemput di lokasi toko."',
        time: '11:15 WIB',
        type: 'chat',
        unread: false,
      },
    ]
  })

  // Live Sync Listener from abis_global_chats & abis_buyer_notifs
  useEffect(() => {
    const handleGlobalSync = () => {
      try {
        const storedGlobal = localStorage.getItem('abis_global_chats')
        if (storedGlobal) {
          const parsed = JSON.parse(storedGlobal)
          if (Array.isArray(parsed)) {
            const formatted: SellerChat[] = parsed.map((item: any) => ({
              id: item.id || `chat-${Date.now()}`,
              sellerName: item.sellerName || item.buyerName || 'Penjual',
              avatar: item.avatar || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=120&h=120&fit=crop',
              lastMessage: item.lastMessage || '',
              time: item.time || 'Baru saja',
              unread: item.unreadForBuyer ?? false,
              messages: item.messages || [],
            }))
            setChats(formatted)

            setActiveChat((currentActive) => {
              if (!currentActive) return null
              const updated = formatted.find(
                (f) => f.id === currentActive.id || f.sellerName === currentActive.sellerName
              )
              return updated || currentActive
            })
          }
        }

        const storedNotifs = localStorage.getItem('abis_buyer_notifs')
        if (storedNotifs) {
          setNotifications(JSON.parse(storedNotifs))
        }
      } catch (e) {}
    }

    window.addEventListener('abis_chat_updated', handleGlobalSync)
    window.addEventListener('storage', handleGlobalSync)

    return () => {
      window.removeEventListener('abis_chat_updated', handleGlobalSync)
      window.removeEventListener('storage', handleGlobalSync)
    }
  }, [])

  const unreadChatCount = chats.filter((c) => c.unread).length
  const unreadNotifCount = notifications.filter((n) => n.unread).length

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
        .select('id, penjual_id, foto_url, nama_makanan, jumlah, harga, batas_waktu_ambil, lokasi_lat, lokasi_lng, created_at, status')
        .neq('status', 'tidak_layak_konsumsi')
        .order('created_at', { ascending: false })

      if (postingError || !postings) {
        setFoodItems([])
        setLoadingFoodItems(false)
        return
      }

      const postingIds = postings.map((item) => item.id)
      const activeTxMap = new Map<string, number>()

      if (postingIds.length > 0) {
        const { data: txs } = await supabase
          .from('transaksi_pembelian')
          .select('postingan_id, status')
          .in('postingan_id', postingIds)
          .neq('status', 'dibatalkan')

        if (txs) {
          for (const tx of txs) {
            const count = activeTxMap.get(tx.postingan_id) || 0
            activeTxMap.set(tx.postingan_id, count + 1)
          }
        }
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

        const rawStock = safeNumber(item.jumlah) ?? 0
        const orderedCount = activeTxMap.get(item.id) || 0
        const stockCount = Math.max(0, rawStock - orderedCount)
        const isOutOfStock = stockCount <= 0 || item.status === 'habis'

        return {
          id: index + 1,
          postingId: item.id,
          title: item.nama_makanan,
          location: sellerName,
          price: safeNumber(item.harga) ?? 0,
          amount: isOutOfStock ? 'Stok Habis' : `${stockCount} Porsi Tersedia`,
          stock: stockCount,
          status: isOutOfStock ? 'habis' : (item.status || 'layak_jual'),
          image: resolveFoodImageUrl(item.foto_url, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80'),
          distanceLabel: getDistanceLabel(distanceKm, index),
          foodType: getFoodTypeFromTitle(item.nama_makanan),
          pickupTime: getPickupTimeLabel(item.batas_waktu_ambil, index),
          latitude: itemLatitude,
          longitude: itemLongitude,
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
      if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
        setShowMessageDropdown(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenFilter(null)
        setShowMessageDropdown(false)
        setShowNotifDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleOpenChatWithSeller = (item: FoodItem) => {
    const sellerId = `seller-${item.location.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    const existing = chats.find((c) => c.id === sellerId || c.sellerName === item.location)

    if (existing) {
      setActiveChat(existing)
      setChats((prev) => prev.map((c) => (c.id === existing.id ? { ...c, unread: false } : c)))
    } else {
      const newTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
      const newChat: SellerChat = {
        id: sellerId,
        sellerName: item.location,
        avatar: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=120&h=120&fit=crop',
        lastMessage: `Menanyakan tentang ${item.title}`,
        time: newTime,
        unread: false,
        messages: [
          {
            sender: 'buyer',
            text: `Halo kak, saya mau menanyakan ketersediaan & detail produk "${item.title}". Apakah bisa dijemput hari ini?`,
            time: newTime,
          },
        ],
      }
      setChats((prev) => [newChat, ...prev])
      setActiveChat(newChat)

      // Sync to abis_global_chats
      try {
        const raw = localStorage.getItem('abis_global_chats')
        let list: any[] = raw ? JSON.parse(raw) : []
        if (!list.some((g) => g.id === sellerId || g.sellerName === item.location)) {
          list.unshift({
            id: sellerId,
            buyerName: userName || 'Pembeli',
            sellerName: item.location,
            avatar: newChat.avatar,
            lastMessage: newChat.lastMessage,
            time: newTime,
            unreadForSeller: true,
            unreadForBuyer: false,
            messages: newChat.messages,
          })
          localStorage.setItem('abis_global_chats', JSON.stringify(list))
          window.dispatchEvent(new Event('abis_chat_updated'))
        }
      } catch (e) {}
    }
  }

  const handleSendBuyerMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!buyerChatText.trim() || !activeChat) return

    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
    const newMsg = { sender: 'buyer' as const, text: buyerChatText.trim(), time: nowTime }
    const targetId = activeChat.id
    const sellerName = activeChat.sellerName

    const updatedMessages = [...activeChat.messages, newMsg]
    const updatedChat = {
      ...activeChat,
      lastMessage: buyerChatText.trim(),
      time: nowTime,
      messages: updatedMessages,
    }

    setActiveChat(updatedChat)

    setChats((prev) =>
      prev.map((c) =>
        c.id === targetId
          ? updatedChat
          : c
      )
    )

    setBuyerChatText('')

    // Save to abis_global_chats for Seller
    try {
      const raw = localStorage.getItem('abis_global_chats')
      let list: any[] = raw ? JSON.parse(raw) : []
      const idx = list.findIndex((g) => g.id === targetId || g.sellerName === sellerName)

      if (idx > -1) {
        list[idx].lastMessage = buyerChatText.trim()
        list[idx].time = nowTime
        list[idx].unreadForSeller = true
        list[idx].unreadForBuyer = false
        list[idx].messages = updatedMessages
      } else {
        list.unshift({
          id: targetId,
          buyerName: userName || 'Pembeli',
          sellerName,
          avatar: activeChat.avatar,
          lastMessage: buyerChatText.trim(),
          time: nowTime,
          unreadForSeller: true,
          unreadForBuyer: false,
          messages: updatedMessages,
        })
      }
      localStorage.setItem('abis_global_chats', JSON.stringify(list))
      window.dispatchEvent(new Event('abis_chat_updated'))
    } catch (e) {
      console.warn('Global chat sync note:', e)
    }
  }

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

  const handleAddToCartAndCheckout = (item: FoodItem) => {
    if (item.stock <= 0 || item.status === 'habis') return

    try {
      const existingRaw = localStorage.getItem('abis_cart')
      let cart: any[] = existingRaw ? JSON.parse(existingRaw) : []

      const existingIndex = cart.findIndex((c) => c.postingId === item.postingId || c.name === item.title)
      if (existingIndex > -1) {
        const currentQty = cart[existingIndex].quantity || 1
        if (currentQty < item.stock) {
          cart[existingIndex].quantity += 1
        }
        cart[existingIndex].stock = item.stock
      } else {
        cart.push({
          id: item.postingId || `item-${Date.now()}`,
          postingId: item.postingId,
          name: item.title,
          price: item.price,
          quantity: 1,
          stock: item.stock,
          image: item.image,
          seller: item.location,
        })
      }

      localStorage.setItem('abis_cart', JSON.stringify(cart))
      navigate('/pembeli/keranjang')
    } catch (e) {
      console.error('Error adding to cart:', e)
      navigate('/pembeli/keranjang')
    }
  }

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

            <div className="flex items-center gap-3 sm:gap-4">
              {/* MESSAGE ICON & POPOVER */}
              <div className="relative" ref={messageRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowMessageDropdown((prev) => !prev)
                    setShowNotifDropdown(false)
                  }}
                  className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#f1efe9] text-[#123d32] shadow-[inset_0_0_0_1px_rgba(18,61,50,0.08)] transition hover:bg-[#e6e2d7]"
                  title="Pesan & Live Chat Penjual"
                >
                  <MessageSquare className="h-5 w-5" />
                  {unreadChatCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ee8d16] text-[10px] font-bold text-white shadow-md">
                      {unreadChatCount}
                    </span>
                  )}
                </button>

                {/* MESSAGE POPOVER */}
                {showMessageDropdown && (
                  <div className="absolute right-0 top-14 z-[9999] w-80 sm:w-96 rounded-2xl border border-[#d9ded6] bg-[#fcfaf5] p-4 shadow-[0_16px_36px_rgba(18,61,50,0.2)] animate-in fade-in slide-in-from-top-2">
                    <div className="mb-3 flex items-center justify-between border-b border-[#e5e2d6] pb-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-[#123d32]" />
                        <h3 className="font-bold text-[#123d32]">Pesan & Live Chat</h3>
                      </div>
                      <span className="rounded-full bg-[#e3eedc] px-2.5 py-0.5 text-xs font-semibold text-[#123d32]">
                        {unreadChatCount} Baru
                      </span>
                    </div>

                    <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                      {chats.map((chat) => (
                        <div
                          key={chat.id}
                          onClick={() => {
                            setActiveChat(chat)
                            setChats((prev) => prev.map((c) => (c.id === chat.id ? { ...c, unread: false } : c)))
                            setShowMessageDropdown(false)
                          }}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl p-3 transition ${
                            chat.unread ? 'border border-[#a8d3b8] bg-[#ebf5ef]' : 'hover:bg-[#f1efe8]'
                          }`}
                        >
                          <img src={chat.avatar} alt={chat.sellerName} className="h-10 w-10 shrink-0 rounded-full object-cover" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="truncate text-sm font-bold text-[#123d32]">{chat.sellerName}</h4>
                              <span className="text-[10px] text-[#7a847c]">{chat.time}</span>
                            </div>
                            <p className="mt-0.5 truncate text-xs text-[#55635a]">{chat.lastMessage}</p>
                          </div>
                          {chat.unread && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#ee8d16]" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* NOTIFICATION ICON & POPOVER */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifDropdown((prev) => !prev)
                    setShowMessageDropdown(false)
                  }}
                  className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#f1efe9] text-[#123d32] shadow-[inset_0_0_0_1px_rgba(18,61,50,0.08)] transition hover:bg-[#e6e2d7]"
                  title="Notifikasi"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>

                {/* NOTIFICATION POPOVER */}
                {showNotifDropdown && (
                  <div className="absolute right-0 top-14 z-[9999] w-80 sm:w-96 rounded-2xl border border-[#d9ded6] bg-[#fcfaf5] p-4 shadow-[0_16px_36px_rgba(18,61,50,0.2)] animate-in fade-in slide-in-from-top-2">
                    <div className="mb-3 flex items-center justify-between border-b border-[#e5e2d6] pb-3">
                      <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-[#123d32]" />
                        <h3 className="font-bold text-[#123d32]">Notifikasi</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))}
                        className="text-xs font-semibold text-[#ee8d16] hover:underline"
                      >
                        Tandai Dibaca
                      </button>
                    </div>

                    <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, unread: false } : item)))
                            setShowNotifDropdown(false)
                          }}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl p-3 transition ${
                            n.unread ? 'border border-[#f2d9b6] bg-[#fef7ee]' : 'hover:bg-[#f1efe8]'
                          }`}
                        >
                          <div className="mt-0.5 rounded-full bg-white p-2 text-[#123d32] shadow-sm">
                            {n.type === 'chat' && <MessageSquare className="h-4 w-4 text-[#ee8d16]" />}
                            {n.type === 'order' && <ShoppingBag className="h-4 w-4 text-[#123d32]" />}
                            {n.type === 'promo' && <Tag className="h-4 w-4 text-amber-500" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-[#123d32]">{n.title}</h4>
                              <span className="text-[10px] text-[#7a847c]">{n.time}</span>
                            </div>
                            <p className="mt-0.5 text-xs text-[#55635a]">{n.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* USER PROFILE CARD */}
              <div className="flex items-center gap-3 rounded-full bg-[#f1efe9] px-3 py-2 shadow-[inset_0_0_0_1px_rgba(18,61,50,0.08)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e7e1d9] text-xs font-bold text-[#123d32]">
                  {getInitials}
                </div>
                <div className="text-right">
                  <div className="text-[12px] font-semibold text-[#123d32]">{userName}</div>
                  <div className="text-[10px] text-[#123d32]/70">{userRole}</div>
                </div>
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
                      <img
                        src={item.image}
                        alt={item.title}
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = DEFAULT_FOOD_IMAGE
                        }}
                        className="h-[150px] w-[170px] object-cover"
                      />
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

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenChatWithSeller(item)}
                            className="flex items-center gap-1.5 rounded-xl border border-[#123d32]/25 bg-[#edf4ee] px-3.5 py-2.5 text-sm font-semibold text-[#123d32] transition hover:bg-[#dcecd0]"
                            title="Tanya Penjual Produk Ini"
                          >
                            <MessageCircle className="h-4 w-4 text-[#123d32]" />
                            <span className="hidden sm:inline">Tanya</span>
                          </button>

                          {item.stock <= 0 || item.status === 'habis' ? (
                            <button
                              type="button"
                              disabled
                              className="rounded-xl bg-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-500 cursor-not-allowed shadow-none"
                            >
                              Stok Habis
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddToCartAndCheckout(item)}
                              className="rounded-xl bg-[#ee8d16] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(238,141,22,0.25)] transition hover:bg-[#dc7d0a]"
                            >
                              Ambil
                            </button>
                          )}
                        </div>
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

              <div className="relative z-0 isolate h-[560px] overflow-hidden rounded-[28px] border border-[#dfe5dd] bg-[#dfe7e4] shadow-[0_14px_30px_rgba(20,39,31,0.08)]">
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
                  {buyerLocation && (
                    <Marker position={buyerLocation} icon={marketMarkerIcon}>
                      <Popup>
                        <div className="text-sm font-semibold text-[#123d32]">Lokasi Anda</div>
                      </Popup>
                    </Marker>
                  )}
                  {filteredFoodItems.map((item) => {
                    const lat = item.latitude ?? (mapCenter[0] + (Math.random() - 0.5) * 0.01)
                    const lng = item.longitude ?? (mapCenter[1] + (Math.random() - 0.5) * 0.01)
                    return (
                      <Marker key={item.id} position={[lat, lng]}>
                        <Popup>
                          <div className="flex flex-col gap-1 max-w-[200px]">
                            <img src={item.image} className="w-full h-24 object-cover rounded-lg" alt={item.title} />
                            <div className="text-sm font-semibold text-[#123d32]">{item.title}</div>
                            <div className="text-xs font-bold text-abisOrange">Rp {item.price.toLocaleString('id-ID')}</div>
                            <div className="text-xs text-[#123d32]/70">{item.location} - {item.distanceLabel}</div>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  })}
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

      {/* BUYER LIVE CHAT MODAL OVERLAY */}
      {activeChat && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex h-[520px] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#e5e2d6] bg-[#f8f6f0] px-6 py-4">
              <div className="flex items-center gap-3">
                <img src={activeChat.avatar} alt={activeChat.sellerName} className="h-10 w-10 rounded-full border-2 border-[#123d32] object-cover" />
                <div>
                  <h3 className="font-bold text-[#123d32] text-base">{activeChat.sellerName}</h3>
                  <p className="flex items-center gap-1 text-xs font-semibold text-[#3a8d54]">
                    <span className="inline-block h-2 w-2 animate-ping rounded-full bg-[#3a8d54]" /> Online (Mitra Penjual)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveChat(null)}
                className="rounded-full p-1.5 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 space-y-4 overflow-y-auto bg-[#faf8f3] p-5">
              {activeChat.messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${msg.sender === 'buyer' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      msg.sender === 'buyer'
                        ? 'rounded-br-none bg-[#123d32] text-white'
                        : 'rounded-bl-none border border-[#e2decb] bg-white text-[#123d32]'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                  <span className="mt-1 px-1 text-[10px] text-[#7a847c]">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Reply Form */}
            <form onSubmit={handleSendBuyerMessage} className="flex items-center gap-2 border-t border-[#e5e2d6] bg-white p-4">
              <input
                type="text"
                value={buyerChatText}
                onChange={(e) => setBuyerChatText(e.target.value)}
                placeholder="Tulis pesan untuk penjual..."
                className="flex-1 rounded-full border border-[#cbd5cf] bg-[#f8f7f2] px-4 py-2.5 text-sm text-[#123d32] outline-none focus:border-[#123d32]"
              />
              <button
                type="submit"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ee8d16] text-white shadow-md transition hover:bg-[#dc7d0a]"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
