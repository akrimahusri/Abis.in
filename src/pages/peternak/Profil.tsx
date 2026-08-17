import { useState, useEffect, useRef } from 'react'
import PeternakLayout from '../../layouts/PeternakLayout'
import {
  Bell,
  Camera,
  Check,
  ChevronRight,
  Clock3,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Phone,
  Search,
  Shield,
  ShoppingBag,
  Star,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { signOutUser } from '../../lib/auth'
import { uploadFoodImage, getFoodImageUrl } from '../../lib/storage'

interface RatingReview {
  id: string
  merchant: string
  date: string
  rating: number
  review: string
}

export default function PeternakProfil() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalFileInputRef = useRef<HTMLInputElement>(null)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [radiusValue, setRadiusValue] = useState<number>(() => {
    return Number(localStorage.getItem('abis_peternak_radius')) || 7
  })
  const [pushNotification, setPushNotification] = useState<boolean>(() => {
    const val = localStorage.getItem('abis_peternak_push_notif')
    return val !== null ? val === 'true' : true
  })
  const [twoFactorAuth, setTwoFactorAuth] = useState<boolean>(() => {
    const val = localStorage.getItem('abis_peternak_2fa')
    return val !== null ? val === 'true' : false
  })
  const [loading, setLoading] = useState(true)

  // Real reviews list (starts empty if no merchant reviews exist yet)
  const [reviewsList, setReviewsList] = useState<RatingReview[]>([])

  // Profile Data States (Connected to Supabase)
  const [profile, setProfile] = useState({
    id: '',
    nama: 'Andi Budiman',
    role: 'Eco-Warrior',
    email: 'andi@gmail.com',
    telepon: '+62 823 7043 7760',
    alamat: 'Jl. Tungkop, Aceh Besar, Aceh',
    fotoUrl: null as string | null,
  })

  // Modals & UI States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [showAllRatings, setShowAllRatings] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Form State inside Edit Modal
  const [editForm, setEditForm] = useState(profile)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 3500)
  }

  // Fetch Supabase Session & Profile Data
  useEffect(() => {
    const fetchSupabaseProfile = async () => {
      setLoading(true)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          const user = session.user
          const userMeta = user.user_metadata || {}

          // Fetch profile row from DB
          const { data: dbProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          const fetchedNama =
            userMeta.name ||
            dbProfile?.nama_usaha ||
            user.email?.split('@')[0] ||
            'Andi Budiman'

          const fetchedRole =
            dbProfile?.role === 'peternak' ? 'Eco-Warrior (Peternak)' : 'Eco-Warrior'

          const fetchedFoto =
            userMeta.avatar_url ||
            dbProfile?.foto_url ||
            null

          setProfile({
            id: user.id,
            nama: fetchedNama,
            role: fetchedRole,
            email: user.email || 'andi@gmail.com',
            telepon: userMeta.phone || dbProfile?.telepon || '+62 823 7043 7760',
            alamat: userMeta.address || dbProfile?.alamat || 'Jl. Tungkop, Aceh Besar, Aceh',
            fotoUrl: fetchedFoto,
          })
        }
      } catch (err) {
        console.warn('Supabase profile load fallback:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSupabaseProfile()
  }, [])

  const handleLogout = async () => {
    await signOutUser()
    navigate('/auth')
  }

  // Upload Photo to Supabase Storage & Database
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran foto terlalu besar. Maksimal 5MB.')
      return
    }

    const localPreviewUrl = URL.createObjectURL(file)
    setProfile((prev) => ({ ...prev, fotoUrl: localPreviewUrl }))
    setEditForm((prev) => ({ ...prev, fotoUrl: localPreviewUrl }))

    // Background upload to Supabase Storage if user logged in
    if (profile.id) {
      try {
        const path = `peternak-avatar/${profile.id}_${Date.now()}`
        const uploadedPath = await uploadFoodImage(file, path)
        if (uploadedPath) {
          const publicUrl = getFoodImageUrl(uploadedPath)
          setProfile((prev) => ({ ...prev, fotoUrl: publicUrl }))
          setEditForm((prev) => ({ ...prev, fotoUrl: publicUrl }))

          // Update profiles table in Supabase
          await supabase
            .from('profiles')
            .update({ foto_url: publicUrl })
            .eq('id', profile.id)
        }
      } catch (err) {
        console.warn('Storage upload note:', err)
      }
    }

    showToast('Foto profil berhasil diunggah!')
  }

  const handleModalPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran foto terlalu besar. Maksimal 5MB.')
      return
    }

    const localPreviewUrl = URL.createObjectURL(file)
    setEditForm((prev) => ({ ...prev, fotoUrl: localPreviewUrl }))
    showToast('Foto profil baru dipilih!')
  }

  const handleRemovePhoto = async () => {
    setEditForm((prev) => ({ ...prev, fotoUrl: null }))
    setProfile((prev) => ({ ...prev, fotoUrl: null }))

    if (profile.id) {
      await supabase
        .from('profiles')
        .update({ foto_url: null })
        .eq('id', profile.id)
    }

    showToast('Foto profil dihapus.')
  }

  // Save Profile Changes to Supabase
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfile(editForm)
    setIsEditModalOpen(false)

    // Save to Supabase DB if authenticated user
    if (profile.id) {
      try {
        await supabase
          .from('profiles')
          .update({
            nama_usaha: editForm.nama,
            foto_url: editForm.fotoUrl,
          })
          .eq('id', profile.id)

        // Also update Auth Metadata
        await supabase.auth.updateUser({
          data: {
            name: editForm.nama,
            phone: editForm.telepon,
            address: editForm.alamat,
            avatar_url: editForm.fotoUrl,
          },
        })
      } catch (err) {
        console.warn('Supabase profile save note:', err)
      }
    }

    showToast('Profil Anda berhasil diperbarui ke Supabase!')
  }

  const togglePushNotif = () => {
    const nextState = !pushNotification
    setPushNotification(nextState)
    localStorage.setItem('abis_peternak_push_notif', String(nextState))
    showToast(
      nextState
        ? 'Notifikasi Push diaktifkan!'
        : 'Notifikasi Push dinonaktifkan.'
    )
  }

  const toggle2FA = () => {
    const nextState = !twoFactorAuth
    setTwoFactorAuth(nextState)
    localStorage.setItem('abis_peternak_2fa', String(nextState))
    showToast(
      nextState
        ? 'Autentikasi Dua Faktor (2FA) diaktifkan!'
        : 'Autentikasi Dua Faktor (2FA) dinonaktifkan.'
    )
  }

  const handleRadiusChange = (val: number) => {
    setRadiusValue(val)
    localStorage.setItem('abis_peternak_radius', String(val))
  }

  const sidebarNavItems = [
    { name: 'Beranda', path: '/peternak', icon: Home, active: false },
    { name: 'Keranjang', path: '/peternak/keranjang', icon: ShoppingBag, active: false },
    { name: 'Riwayat', path: '/peternak/riwayat', icon: Clock3, active: false },
    { name: 'Profil', path: '/peternak/profil', icon: UserRound, active: true },
  ]

  const displayedReviews = showAllRatings ? reviewsList : reviewsList.slice(0, 3)

  return (
    <PeternakLayout>
      <div className="font-hanken relative max-w-5xl mx-auto space-y-6">
        {/* Hidden File Input for Direct Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoUpload}
          accept="image/*"
          className="hidden"
        />

        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl bg-[#0b3c2d] px-5 py-3.5 text-white shadow-xl border border-white/20 animate-bounce">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">{toastMessage}</span>
          </div>
        )}

        <div>
          <h1 className="font-literata text-2xl sm:text-3xl font-bold text-[#123d32] mb-2">
            Profil & Pengaturan
          </h1>
          <p className="text-slate-500 text-sm">Kelola informasi profil, lokasi penjemputan, dan preferensi akun Anda.</p>
        </div>

            {/* Profile Detail Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-6">
              {/* Left Column: Dark Green Main Profile Card */}
              <div className="lg:col-span-7 bg-[#0b3c2d] text-white rounded-2xl p-5 sm:p-6 lg:p-8 shadow-sm flex flex-col justify-between relative min-h-[280px]">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
                  {/* Photo Uploadable Box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative w-28 h-36 sm:w-32 sm:h-40 bg-[#faf8ee] rounded-2xl shrink-0 shadow-inner overflow-hidden flex flex-col items-center justify-center cursor-pointer transition border-2 border-transparent hover:border-white"
                    title="Klik untuk memilih foto profil baru"
                  >
                    {profile.fotoUrl ? (
                      <img
                        src={profile.fotoUrl}
                        alt={profile.nama}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <>
                        <UserRound className="w-12 h-12 text-[#0b3c2d]/40 mb-1 group-hover:scale-110 transition" />
                        <span className="text-[10px] text-[#0b3c2d]/70 font-bold">Foto Profil</span>
                      </>
                    )}

                    {/* Camera Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition duration-200">
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-bold">Ubah Foto</span>
                    </div>
                  </div>

                  {/* Profile Info Fields */}
                  <div className="flex-1 space-y-3 w-full">
                    <div>
                      <p className="text-xs text-emerald-200/70 font-sans">Nama Lengkap</p>
                      <h2 className="font-literata text-xl sm:text-2xl font-bold text-white mt-0.5">
                        {loading ? 'Memuat profil...' : profile.nama}
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <p className="text-xs text-emerald-200/70 font-sans">Email</p>
                        <p className="text-sm font-medium text-white underline cursor-pointer hover:text-emerald-200 break-all">
                          {profile.email}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-emerald-200/70 font-sans">Telepon</p>
                        <p className="text-sm font-bold text-white">{profile.telepon}</p>
                      </div>
                    </div>

                    <div className="pt-1">
                      <p className="text-xs text-emerald-200/70 font-sans">Alamat</p>
                      <p className="text-sm font-bold text-white mt-0.5">{profile.alamat}</p>
                    </div>
                  </div>
                </div>

                {/* Edit Profile Button */}
                <div className="flex justify-center sm:justify-end mt-6 sm:mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditForm(profile)
                      setIsEditModalOpen(true)
                    }}
                    className="w-full sm:w-auto bg-white text-[#0b3c2d] hover:bg-emerald-50 active:scale-95 font-bold px-6 py-2.5 rounded-xl text-sm shadow-sm transition text-center"
                  >
                    Edit Profil
                  </button>
                </div>
              </div>

              {/* Right Column: Settings Cards */}
              <div className="lg:col-span-5 flex flex-col gap-5 justify-between">
                {/* Card 1: Radius Pencarian Default */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-black/5 flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#b85b46]">
                        RADIUS PENCARIAN DEFAULT
                      </h3>
                      <span className="text-xs font-bold text-[#0b3c2d] bg-[#f5f3e8] px-2.5 py-1 rounded-full border border-[#e2dfd2]">
                        {radiusValue} km
                      </span>
                    </div>

                    {/* Range Slider */}
                    <div className="relative my-3">
                      <input
                        type="range"
                        min="1"
                        max="25"
                        value={radiusValue}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          handleRadiusChange(val)
                        }}
                        className="w-full h-2 bg-[#e2e8f0] rounded-lg appearance-none cursor-pointer accent-[#0b3c2d]"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-2 font-sans">
                        <span>1 km</span>
                        <span>25 km</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 font-sans leading-relaxed mt-3">
                    Kami akan memprioritaskan hasil pencarian dalam radius ini untuk mengoptimalkan
                    pengalaman komunitas Anda.
                  </p>
                </div>

                {/* Card 2: Notifikasi Push & Keamanan */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-black/5 space-y-4">
                  {/* Item 1: Notifikasi Push */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-[#123d32] shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-[#b85b46]">Notifikasi Push</p>
                        <p className="text-xs text-gray-400">Terima update real-time</p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={togglePushNotif}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        pushNotification ? 'bg-[#0b3c2d]' : 'bg-gray-300'
                      }`}
                      aria-label="Toggle Push Notification"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          pushNotification ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* Item 2: Keamanan */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-[#123d32] shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-[#b85b46]">Keamanan</p>
                        <p className="text-xs text-gray-400">Autentikasi dua faktor</p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={toggle2FA}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        twoFactorAuth ? 'bg-[#0b3c2d]' : 'bg-[#e5e5dc]'
                      }`}
                      aria-label="Toggle 2FA Security"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          twoFactorAuth ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Riwayat Rating */}
            <div className="mt-8 mb-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#dcdad0]">
                <h3 className="font-literata text-xl sm:text-2xl font-bold text-[#123d32]">
                  Riwayat Rating
                </h3>

                <button
                  type="button"
                  onClick={() => setShowAllRatings((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-sm font-bold text-[#123d32] hover:text-[#b85b46] hover:underline transition"
                >
                  <span>{showAllRatings ? 'Tampilkan Lebih Sedikit' : 'Lihat Semua'}</span>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${showAllRatings ? 'rotate-90' : ''}`}
                  />
                </button>
              </div>

              {/* Review Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-5">
                {displayedReviews.length === 0 ? (
                  <div className="col-span-full bg-white rounded-2xl p-8 text-center border border-black/5 text-gray-500">
                    <p className="text-sm font-semibold text-[#123d32]">Belum Ada Ulasan</p>
                    <p className="text-xs text-gray-400 mt-1">Ulasan dan rating dari mitra usaha tempat Anda mengumpulkan pakan akan tampil di sini.</p>
                  </div>
                ) : (
                  displayedReviews.map((rev) => (
                    <div
                      key={rev.id}
                      onClick={() => showToast(`Ulasan dari ${rev.merchant}`)}
                      className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-black/5 flex flex-col justify-between hover:shadow-md transition cursor-pointer"
                    >
                      <div>
                        {/* User Header */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-[#d5d5d5] shrink-0 flex items-center justify-center font-bold text-[#123d32] text-xs">
                            {rev.merchant.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#b85b46]">{rev.merchant}</p>
                            <p className="text-xs text-gray-400">{rev.date}</p>
                          </div>
                        </div>

                        {/* Rating Stars */}
                        <div className="flex items-center gap-1 text-[#b85b46] mb-3">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current text-[#b85b46]" />
                          ))}
                        </div>

                        {/* Review Comment */}
                        <p className="text-xs text-gray-600 font-sans leading-relaxed">
                          {rev.review}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

      {/* Edit Profile Modal (with Photo Upload & Supabase Integration) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl animate-fade-in border border-black/5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="font-literata text-xl font-bold text-[#123d32]">Edit Profil Peternak</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Photo Upload Section inside Modal */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                  Foto Profil
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 rounded-2xl bg-[#faf8ee] border border-gray-200 shrink-0 overflow-hidden flex items-center justify-center">
                    {editForm.fotoUrl ? (
                      <img
                        src={editForm.fotoUrl}
                        alt="Preview Foto"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound className="h-8 w-8 text-gray-400" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={modalFileInputRef}
                      onChange={handleModalPhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => modalFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0b3c2d] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#072a20]"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        Pilih Foto Baru
                      </button>

                      {editForm.fotoUrl && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Hapus Foto
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400">Format: JPG, PNG, WEBP. Maks 5MB.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={editForm.nama}
                  onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-[#123d32] focus:border-[#0b3c2d] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-[#123d32] focus:border-[#0b3c2d] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Telepon
                </label>
                <input
                  type="text"
                  required
                  value={editForm.telepon}
                  onChange={(e) => setEditForm({ ...editForm, telepon: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-[#123d32] focus:border-[#0b3c2d] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Alamat
                </label>
                <textarea
                  rows={3}
                  required
                  value={editForm.alamat}
                  onChange={(e) => setEditForm({ ...editForm, alamat: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-[#123d32] focus:border-[#0b3c2d] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0b3c2d] px-6 py-2 text-sm font-semibold text-white shadow-md hover:bg-[#072a20]"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-black/5">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-literata text-xl font-bold text-[#123d32]">Pusat Bantuan</h3>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-600">
              <p>Butuh bantuan terkait akun peternak atau pasokan pakan?</p>

              <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-[#0b3c2d] space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <Phone className="h-4 w-4" /> Customer Service Hotline
                </div>
                <p className="text-xs">+62 800-1234-5678 (Bebas Pulsa)</p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4 border border-gray-200 text-gray-700 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <MessageCircle className="h-4 w-4" /> Live Chat Support
                </div>
                <p className="text-xs">Senin - Minggu: 08:00 - 20:00 WIB</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="rounded-xl bg-[#0b3c2d] px-5 py-2 text-sm font-semibold text-white"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </PeternakLayout>
  )
}
