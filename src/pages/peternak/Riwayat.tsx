import { useState, useEffect } from 'react'
import {
  Bell,
  Check,
  Clock3,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Phone,
  Search,
  ShoppingBag,
  Star,
  AlertCircle,
  UserRound,
  X,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { signOutUser } from '../../lib/auth'

type TransactionStatus = 'Selesai' | 'Dibatalkan'

interface Transaction {
  id: string
  title: string
  merchant: string
  status: TransactionStatus
  date: string
  price: string
  image: string
}

const defaultMockTransactions: Transaction[] = [
  {
    id: '1',
    title: 'Nasi Ayam Geprek',
    merchant: 'Warung Berkah',
    status: 'Selesai',
    date: '20 Juli 2026, 18.30',
    price: 'Rp 20.000',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: '2',
    title: 'Nasi Bakar Ayam Suwir',
    merchant: 'Warung Berkah',
    status: 'Dibatalkan',
    date: '25 Juli 2026, 18.00',
    price: 'Rp 30.000',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: '3',
    title: 'Nasi Kotak',
    merchant: 'Warung Berkah',
    status: 'Selesai',
    date: '25 Juli 2026, 18.00',
    price: 'Rp 25.000',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=300&q=80',
  },
]

function formatTransactionDate(dateStr: string) {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PeternakRiwayat() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'Semua' | 'Selesai' | 'Dibatalkan'>('Semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>(defaultMockTransactions)
  const [loadingTransactions, setLoadingTransactions] = useState(true)

  // User Profile
  const [userName, setUserName] = useState('Andi Budiman')
  const [userAvatar, setUserAvatar] = useState<string | null>(null)

  // Track User Ratings per Transaction ID
  const [userRatings, setUserRatings] = useState<Record<string, number>>({})

  // Interactive Rating Modal States
  const [ratingModalTx, setRatingModalTx] = useState<Transaction | null>(null)
  const [selectedRating, setSelectedRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [ratingComment, setRatingComment] = useState('')

  // Report & Help Modals
  const [reportModalTx, setReportModalTx] = useState<Transaction | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Fetch Supabase User & Transactions
  useEffect(() => {
    const fetchSupabaseData = async () => {
      setLoadingTransactions(true)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          const user = session.user
          const userMeta = user.user_metadata || {}

          setUserName(userMeta.name || user.email?.split('@')[0] || 'Andi Budiman')
          setUserAvatar(userMeta.avatar_url || null)

          // Fetch pasokan_maggot row for peternak
          const { data: pasokanRows } = await supabase
            .from('pasokan_maggot')
            .select('*, postingan_makanan(*)')
            .eq('peternak_id', user.id)
            .order('created_at', { ascending: false })

          if (pasokanRows && pasokanRows.length > 0) {
            const mapped: Transaction[] = pasokanRows.map((row, idx) => {
              const posting = row.postingan_makanan
              return {
                id: row.id || String(idx + 1),
                title: posting?.nama_makanan || 'Pasokan Pakan Organik',
                merchant: 'Warung Berkah',
                status: row.status === 'selesai' ? 'Selesai' : 'Selesai',
                date: formatTransactionDate(row.created_at),
                price: `Rp ${(row.total_token || row.harga_per_kg || 20000).toLocaleString('id-ID')}`,
                image: posting?.foto_url || defaultMockTransactions[idx % 3].image,
              }
            })
            setTransactions(mapped)
          }
        }
      } catch (err) {
        console.warn('Supabase data load fallback:', err)
      } finally {
        setLoadingTransactions(false)
      }
    }

    fetchSupabaseData()
  }, [])

  const handleLogout = async () => {
    await signOutUser()
    navigate('/auth')
  }

  const handleOpenRating = (tx: Transaction) => {
    const existingRating = userRatings[tx.id] || 0
    setSelectedRating(existingRating)
    setHoverRating(0)
    setRatingComment('')
    setRatingModalTx(tx)
  }

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ratingModalTx || selectedRating === 0) {
      showToast('Silakan pilih rating bintang terlebih dahulu.')
      return
    }

    // Save rating score locally
    setUserRatings((prev) => ({
      ...prev,
      [ratingModalTx.id]: selectedRating,
    }))

    // Also send report/rating to Supabase if authenticated
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        await supabase.from('laporan_moderasi').insert({
          pelapor_id: session.user.id,
          terlapor_id: session.user.id,
          alasan: `Rating ${selectedRating} bintang: ${ratingComment || 'Puas dengan layanan'}`,
          status: 'selesai',
        })
      }
    } catch (err) {
      console.warn('Supabase rating save note:', err)
    }

    showToast(`Terima kasih! Rating ${selectedRating} bintang berhasil dikirim untuk ${ratingModalTx.title}.`)
    setRatingModalTx(null)
    setRatingComment('')
    setSelectedRating(0)
  }

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        await supabase.from('laporan_moderasi').insert({
          pelapor_id: session.user.id,
          terlapor_id: session.user.id,
          alasan: `Kendala ${reportModalTx?.title}: ${reportReason}`,
          status: 'open',
        })
      }
    } catch (err) {
      console.warn('Supabase report save note:', err)
    }

    showToast(`Laporan kendala pesanan ${reportModalTx?.title} telah diterima tim CS.`)
    setReportModalTx(null)
    setReportReason('')
  }

  const sidebarNavItems = [
    { name: 'Beranda', path: '/peternak', icon: Home, active: false },
    { name: 'Keranjang', path: '/peternak/keranjang', icon: ShoppingBag, active: false },
    { name: 'Riwayat', path: '/peternak/riwayat', icon: Clock3, active: true },
    { name: 'Profil', path: '/peternak/profil', icon: UserRound, active: false },
  ]

  const filteredTransactions = transactions.filter((tx) => {
    const matchesTab = activeTab === 'Semua' || tx.status === activeTab
    const matchesSearch =
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.merchant.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  return (
    <div className="min-h-screen bg-[#123c2f] font-hanken relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl bg-[#0b3c2d] px-5 py-3.5 text-white shadow-xl border border-white/20 animate-bounce">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Sidebar Peternak */}
        <aside className="w-full bg-[#123c2f] lg:sticky lg:top-0 lg:h-screen lg:w-[260px] lg:shrink-0 lg:flex lg:flex-col lg:justify-between lg:py-8">
          <div>
            <div className="flex items-center justify-between px-5 py-4 lg:px-8 lg:py-0">
              <Link to="/" className="block">
                <img
                  src="/images/Logo sidebar.png"
                  alt="Abis.in"
                  className="h-10 w-auto object-contain lg:h-16"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const parent = e.currentTarget.parentElement
                    if (parent && !parent.querySelector('.logo-fallback')) {
                      const fallback = document.createElement('div')
                      fallback.className =
                        'logo-fallback flex items-center gap-2 text-lg font-bold font-literata text-white'
                      fallback.innerHTML = `<span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1b4332] text-sm">🌱</span> abis.in`
                      parent.appendChild(fallback)
                    }
                  }}
                />
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white lg:hidden"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

            <nav
              className={`${
                mobileMenuOpen ? 'flex' : 'hidden'
              } flex-col gap-2 pb-4 pt-2 lg:flex lg:pb-0 lg:pt-0`}
            >
              {sidebarNavItems.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    navigate(item.path)
                  }}
                  className={`flex items-center gap-3 py-3.5 font-semibold transition-colors ${
                    item.active
                      ? 'ml-3 rounded-l-[2rem] bg-[#F8F9EB] pl-5 text-abisGreen lg:ml-6 lg:pl-6'
                      : 'ml-3 rounded-l-[2rem] pl-5 text-white hover:bg-white/5 lg:ml-6 lg:pl-6'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </button>
              ))}
            </nav>
          </div>

          <div
            className={`${
              mobileMenuOpen ? 'flex' : 'hidden'
            } flex-col gap-3 px-5 pb-6 lg:flex lg:px-8 lg:pb-0`}
          >
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false)
                setIsHelpOpen(true)
              }}
              className="flex items-center gap-3 py-2 text-left font-semibold text-white transition hover:text-abisOrange"
            >
              <HelpCircle className="h-5 w-5" />
              Bantuan
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false)
                handleLogout()
              }}
              className="flex items-center gap-3 py-2 text-left font-semibold text-white transition hover:text-red-400"
            >
              <LogOut className="h-5 w-5" />
              Keluar
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-[#f5f3e8] p-4 sm:p-6 lg:p-10 lg:h-screen lg:overflow-y-auto">
          <div className="mx-auto max-w-5xl">
            {/* Top Header Row */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="flex-1">
                <h1 className="font-literata text-2xl sm:text-3xl lg:text-4xl font-bold text-[#123d32]">
                  Riwayat Pembelian
                </h1>

                {/* Search Box */}
                <div className="mt-3 flex items-center gap-2.5 rounded-full bg-[#efede2] border border-[#e2dfd2] px-4 py-2 w-full sm:max-w-sm shadow-inner">
                  <Search className="h-4 w-4 text-gray-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Cari Transaksi . . ."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-sm text-[#123d32] placeholder-gray-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* User Profile Bar */}
              <div className="flex items-center justify-between sm:justify-end gap-3 rounded-2xl bg-white/60 p-2 sm:bg-transparent sm:p-0 relative">
                <div className="flex items-center gap-3">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="h-10 w-10 rounded-full object-cover shrink-0 border border-[#123d32]/20"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-[#d5d5d5] flex-shrink-0 flex items-center justify-center font-bold text-[#123d32]">
                      {userName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left sm:text-right">
                    <p className="font-bold text-sm text-[#123d32]">{userName}</p>
                    <p className="text-xs text-gray-500 font-medium">Eco-Warrior</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNotifOpen((prev) => !prev)}
                  className="p-2 text-[#123d32] hover:bg-black/5 rounded-full transition ml-auto sm:ml-0 relative"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                </button>

                {/* Notifications Dropdown */}
                {isNotifOpen && (
                  <div className="absolute top-14 right-0 z-40 w-72 rounded-2xl bg-white p-4 shadow-xl border border-black/5 text-left">
                    <div className="flex items-center justify-between border-b pb-2 mb-2">
                      <h4 className="font-bold text-sm text-[#123d32]">Notifikasi</h4>
                      <button
                        onClick={() => setIsNotifOpen(false)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Tutup
                      </button>
                    </div>
                    <div className="space-y-2 text-xs text-gray-600">
                      <p className="p-2 rounded-lg bg-emerald-50 text-[#0b3c2d]">
                        🌱 Transaksi pesanan pasokan pakan berhasil dikonfirmasi!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Impact Cards Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 my-6">
              {/* Dark Green Impact Card */}
              <div className="lg:col-span-7 bg-[#0b3c2d] text-white rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between min-h-[150px]">
                <div>
                  <p className="text-xs text-emerald-200/70 font-sans tracking-wide">
                    Dampak Kolektif Anda
                  </p>
                  <h2 className="font-literata text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-2 mb-3">
                    12 Kg Sampah Dialihkan
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-emerald-100/80 font-sans leading-relaxed">
                  Anda telah menyelamatkan setara dengan 18 porsi makanan dari pembuangan
                </p>
              </div>

              {/* White Emission Card */}
              <div className="lg:col-span-5 bg-white text-[#123d32] rounded-2xl p-5 sm:p-6 shadow-sm border border-black/5 flex flex-col justify-between min-h-[150px]">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#b85b46]">
                    EMISI CO2 DICEGAH
                  </p>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#123d32] mt-2 mb-3 font-sans">
                    3.2 kg CO2e
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 font-sans leading-relaxed">
                  Setara dengan menanam 1 pohon dewasa
                </p>
              </div>
            </div>

            {/* Daftar Transaksi Header & Filter Tabs */}
            <div className="mt-8 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#dcdad0]">
                <h3 className="font-literata text-xl sm:text-2xl font-bold text-[#123d32]">
                  Daftar Transaksi
                </h3>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  {(['Semua', 'Selesai', 'Dibatalkan'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-full px-4 sm:px-5 py-1.5 text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                        activeTab === tab
                          ? 'bg-[#deded3] text-[#123d32]'
                          : 'text-[#123d32]/75 hover:text-[#123d32] hover:bg-black/5'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Transaction Cards List */}
            {loadingTransactions ? (
              <div className="mt-6 rounded-2xl border border-dashed border-[#d9d7c9] bg-white p-8 text-center text-sm text-[#123d32]/70 shadow-sm">
                Memuat riwayat transaksi peternak dari Supabase...
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((tx) => {
                  const isCancelled = tx.status === 'Dibatalkan'
                  const givenRating = userRatings[tx.id]
                  const isRated = Boolean(givenRating)

                  return (
                    <div
                      key={tx.id}
                      className={`rounded-2xl p-4 sm:p-5 border border-black/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition ${
                        isCancelled
                          ? 'bg-[#eeebe2]'
                          : 'bg-white shadow-sm hover:shadow-md'
                      }`}
                    >
                      {/* Left Side: Image & Content */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 w-full sm:w-auto">
                        <img
                          src={tx.image}
                          alt={tx.title}
                          className="w-full h-44 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-xl sm:rounded-2xl object-cover shrink-0"
                        />

                        <div className="flex flex-col justify-between py-0.5 w-full">
                          <div>
                            {/* Status Badge */}
                            <span
                              className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold text-white mb-1.5 ${
                                isCancelled ? 'bg-[#e5988b]' : 'bg-[#0b3c2d]'
                              }`}
                            >
                              {tx.status}
                            </span>

                            {/* Title & Merchant */}
                            <h4
                              className={`font-literata text-base sm:text-lg font-bold ${
                                isCancelled ? 'text-[#4a5568]' : 'text-[#123d32]'
                              }`}
                            >
                              {tx.title}
                            </h4>
                            <p className="text-xs text-gray-500 mb-3">{tx.merchant}</p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <button
                              type="button"
                              disabled={isCancelled}
                              onClick={() => handleOpenRating(tx)}
                              className={`rounded-full px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition ${
                                isCancelled
                                  ? 'bg-[#9aa59c] text-white opacity-80 cursor-not-allowed'
                                  : isRated
                                    ? 'bg-[#0b3c2d] border border-[#facc15]/40 text-white hover:bg-[#072a20] shadow-sm active:scale-95'
                                    : 'bg-[#0b3c2d] text-white hover:bg-[#072a20] shadow-sm active:scale-95'
                              }`}
                            >
                              <Star
                                className={`h-3.5 w-3.5 transition-colors ${
                                  isRated
                                    ? 'fill-[#facc15] text-[#facc15] drop-shadow-sm'
                                    : 'fill-current text-white'
                                }`}
                              />
                              <span>
                                {isRated ? `Sudah Dinilai (${givenRating}★)` : 'Beri Rating'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setReportModalTx(tx)}
                              className={`rounded-full px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 ${
                                isCancelled
                                  ? 'border border-[#b8a299] text-[#b8a299] hover:bg-black/5'
                                  : 'border border-[#c05638] text-[#c05638] hover:bg-[#c05638]/5'
                              }`}
                            >
                              <AlertCircle className="h-3.5 w-3.5" />
                              <span>Laporkan Masalah</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Date & Price */}
                      <div className="w-full sm:w-auto flex sm:flex-col justify-between sm:justify-end items-center sm:items-end border-t sm:border-t-0 pt-3 sm:pt-0 border-black/5 mt-1 sm:mt-0">
                        <p className="text-xs text-gray-400 font-sans">{tx.date}</p>

                        <div className="sm:mt-4 text-right">
                          <span className="text-xs text-gray-400 font-sans block">
                            Total Bayar
                          </span>
                          <span
                            className={`font-bold text-base sm:text-lg lg:text-xl font-sans ${
                              isCancelled ? 'text-[#c77d6e]' : 'text-[#c05638]'
                            }`}
                          >
                            {tx.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {filteredTransactions.length === 0 && (
                  <div className="rounded-2xl bg-white p-8 text-center border border-dashed border-[#d9d7c9]">
                    <p className="font-semibold text-[#123d32]">Tidak ada transaksi ditemukan</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Coba ubah kata kunci pencarian atau filter status.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Interactive 5-Star Rating Modal */}
      {ratingModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-black/5 text-center">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-literata text-lg font-bold text-[#123d32]">Beri Rating</h3>
              <button onClick={() => setRatingModalTx(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRating} className="space-y-4">
              <p className="text-xs text-gray-600">
                Bagaimana penilaian Anda untuk <span className="font-bold text-[#123d32]">{ratingModalTx.title}</span>?
              </p>

              {/* 5 Star Rating Icons */}
              <div
                className="flex items-center justify-center gap-2 py-3"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const activeRating = hoverRating || selectedRating
                  const isYellow = star <= activeRating

                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onClick={() => setSelectedRating(star)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`h-9 w-9 transition-colors duration-200 ${
                          isYellow
                            ? 'fill-[#facc15] text-[#facc15] drop-shadow-sm'
                            : 'fill-transparent text-gray-300'
                        }`}
                      />
                    </button>
                  )
                })}
              </div>

              <p className="text-xs font-semibold h-4 text-[#b85b46]">
                {(hoverRating || selectedRating) === 1 && 'Sangat Buruk 😞'}
                {(hoverRating || selectedRating) === 2 && 'Buruk 🙁'}
                {(hoverRating || selectedRating) === 3 && 'Cukup 🙂'}
                {(hoverRating || selectedRating) === 4 && 'Bagus 😊'}
                {(hoverRating || selectedRating) === 5 && 'Sangat Bagus! 😍'}
              </p>

              <div>
                <textarea
                  rows={3}
                  placeholder="Tulis ulasan Anda (opsional)..."
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-3 text-xs focus:border-[#0b3c2d] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRatingModalTx(null)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={selectedRating === 0}
                  className={`rounded-xl px-5 py-2 text-xs font-semibold text-white transition ${
                    selectedRating > 0
                      ? 'bg-[#0b3c2d] hover:bg-[#072a20] shadow-md'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  Kirim Rating
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Problem Modal */}
      {reportModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-black/5">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-literata text-xl font-bold text-[#c05638]">Laporkan Masalah</h3>
              <button onClick={() => setReportModalTx(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <p className="text-sm text-gray-600">
                Laporkan kendala terkait pesanan <span className="font-bold text-[#123d32]">{reportModalTx.title}</span>.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Deskripsi Kendala
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Jelaskan masalah yang Anda alami..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-[#c05638] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalTx(null)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#c05638] px-5 py-2 text-sm font-semibold text-white"
                >
                  Kirim Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-black/5">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-literata text-xl font-bold text-[#123d32]">Pusat Bantuan</h3>
              <button onClick={() => setIsHelpOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-600">
              <p>Butuh bantuan terkait pesanan atau riwayat transaksi?</p>

              <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-[#0b3c2d] space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <Phone className="h-4 w-4" /> Customer Service Hotline
                </div>
                <p className="text-xs">+62 800-1234-5678 (Bebas Pulsa)</p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4 border border-gray-200 text-gray-700 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <MessageCircle className="h-4 w-4" /> Live Chat CS
                </div>
                <p className="text-xs">Senin - Minggu: 08:00 - 20:00 WIB</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="rounded-xl bg-[#0b3c2d] px-5 py-2 text-sm font-semibold text-white"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
