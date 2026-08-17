import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, ChevronRight, Clock3, HelpCircle, Home, Lock, LogOut, Search, Shield, ShoppingBag, Star, UserRound, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { signOutUser } from '../../lib/auth'
import { buyerContentClass, buyerPageTitleClass, buyerSidebarClass } from './styles'

const sidebarItems = [
  { label: 'Beranda', icon: Home, active: false, path: '/pembeli' },
  { label: 'Keranjang', icon: ShoppingBag, active: false, path: '/pembeli/keranjang' },
  { label: 'Riwayat', icon: Clock3, active: false, path: '/pembeli/riwayat' },
  { label: 'Profil', icon: UserRound, active: true, path: '/pembeli/detail' },
]

type RatingItem = {
  id: number
  title: string
  date: string
  text: string
}

const ratingCards: RatingItem[] = []

/** Reusable toggle switch */
function ToggleSwitch({ value, onChange, id }: { value: boolean; onChange: () => void; id: string }) {
  return (
    <button
      type="button"
      id={id}
      onClick={onChange}
      aria-pressed={value}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${value ? 'bg-[#0f4b37]' : 'bg-gray-300'
        }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${value ? 'translate-x-5' : 'translate-x-0'
          }`}
      />
    </button>
  )
}

export default function PembeliDetail() {
  const navigate = useNavigate()

  // Profile
  const [userName, setUserName] = useState('Pembeli')
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState('Pembeli Aktif')
  const [userPhone, setUserPhone] = useState('')
  const [userAddress, setUserAddress] = useState('')

  // Settings
  const [radiusEnabled, setRadiusEnabled] = useState(false)
  const [radiusValue, setRadiusValue] = useState(9)
  const [pushNotif, setPushNotif] = useState(true)
  const [keamanan, setKeamanan] = useState(false)

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ nama: '', telepon: '', alamat: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Keamanan info
  const [showKeamananInfo, setShowKeamananInfo] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('email, role, nama_usaha, telepon, alamat')
        .eq('id', session.user.id)
        .single()

      if (!error && data) {
        const name = session.user.email?.split('@')[0] || data.nama_usaha || 'Pembeli'
        setUserName(name)
        setUserEmail(data.email || session.user.email || '')
        setUserRole(data.role === 'pembeli' ? 'Pembeli Aktif' : data.role || 'Pembeli Aktif')
        setUserPhone(data.telepon || '')
        setUserAddress(data.alamat || '')
        setEditForm({ nama: name, telepon: data.telepon || '', alamat: data.alamat || '' })
      } else {
        const name = session.user.email?.split('@')[0] || 'Pembeli'
        setUserName(name)
        setUserEmail(session.user.email || '')
        setEditForm({ nama: name, telepon: '', alamat: '' })
      }
    }
    fetchProfile()
  }, [])

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) setIsEditOpen(false)
    }
    if (isEditOpen) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [isEditOpen])

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsEditOpen(false) }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  const initials = useMemo(() => {
    const parts = userName.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return userName.slice(0, 2).toUpperCase()
  }, [userName])

  const goTo = (path: string) => navigate(path)

  const handleLogout = async () => {
    await signOutUser()
    navigate('/auth')
  }

  const openEdit = () => {
    setEditForm({ nama: userName, telepon: userPhone, alamat: userAddress })
    setSaveSuccess(false)
    setIsEditOpen(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await supabase
          .from('profiles')
          .update({ nama_usaha: editForm.nama, telepon: editForm.telepon, alamat: editForm.alamat })
          .eq('id', session.user.id)
      }
      setUserName(editForm.nama)
      setUserPhone(editForm.telepon)
      setUserAddress(editForm.alamat)
      setSaveSuccess(true)
      setTimeout(() => { setIsEditOpen(false); setSaveSuccess(false) }, 1200)
    } catch { /* silent */ } finally { setIsSaving(false) }
  }

  return (
    <>
      {/* ── Edit Profil Modal ── */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div
            ref={modalRef}
            className="w-full max-w-md rounded-[1.5rem] bg-white p-7 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#123d32]">Edit Profil</h2>
                <p className="text-xs text-[#7b8479] mt-0.5">Perbarui informasi akun Anda</p>
              </div>
              <button type="button" onClick={() => setIsEditOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f0e4] text-[#123d32] hover:bg-[#e2dfd2] transition">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-center mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0f4b37] text-white text-2xl font-bold shadow-lg">
                {(editForm.nama.slice(0, 2) || initials).toUpperCase()}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#123d32] mb-1.5 uppercase tracking-wide">Nama Lengkap</label>
                <input id="edit-nama" type="text" value={editForm.nama}
                  onChange={(e) => setEditForm((f) => ({ ...f, nama: e.target.value }))}
                  placeholder="Masukkan nama lengkap"
                  className="w-full rounded-xl border border-[#e2dfd2] bg-[#faf8f1] px-4 py-2.5 text-sm text-[#123d32] outline-none focus:border-[#0f4b37] focus:ring-2 focus:ring-[#0f4b37]/15 placeholder:text-[#a0a8a3]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#123d32] mb-1.5 uppercase tracking-wide">Email</label>
                <input type="email" value={userEmail} readOnly
                  className="w-full rounded-xl border border-[#e2dfd2] bg-[#f3f0e4] px-4 py-2.5 text-sm text-[#7b8479] outline-none cursor-not-allowed" />
                <p className="mt-1 text-[0.7rem] text-[#a0a8a3]">Email tidak dapat diubah</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#123d32] mb-1.5 uppercase tracking-wide">No. Telepon</label>
                <input id="edit-telepon" type="tel" value={editForm.telepon}
                  onChange={(e) => setEditForm((f) => ({ ...f, telepon: e.target.value }))}
                  placeholder="Contoh: 08123456789"
                  className="w-full rounded-xl border border-[#e2dfd2] bg-[#faf8f1] px-4 py-2.5 text-sm text-[#123d32] outline-none focus:border-[#0f4b37] focus:ring-2 focus:ring-[#0f4b37]/15 placeholder:text-[#a0a8a3]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#123d32] mb-1.5 uppercase tracking-wide">Alamat</label>
                <textarea id="edit-alamat" rows={3} value={editForm.alamat}
                  onChange={(e) => setEditForm((f) => ({ ...f, alamat: e.target.value }))}
                  placeholder="Masukkan alamat lengkap"
                  className="w-full resize-none rounded-xl border border-[#e2dfd2] bg-[#faf8f1] px-4 py-2.5 text-sm text-[#123d32] outline-none focus:border-[#0f4b37] focus:ring-2 focus:ring-[#0f4b37]/15 placeholder:text-[#a0a8a3]" />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setIsEditOpen(false)}
                className="flex-1 rounded-xl border border-[#e2dfd2] bg-white py-2.5 text-sm font-semibold text-[#7b8479] hover:bg-[#f3f0e4] transition">Batal</button>
              <button type="button" onClick={handleSave} disabled={isSaving}
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition ${saveSuccess ? 'bg-emerald-500' : isSaving ? 'bg-[#0f4b37]/60 cursor-not-allowed' : 'bg-[#0f4b37] hover:bg-[#0a3628] active:scale-95'
                  }`}>
                {saveSuccess ? '✓ Tersimpan' : isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Keamanan Info Modal ── */}
      {showKeamananInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-[1.5rem] bg-white p-7 shadow-2xl text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0f4b37]/10">
                <Shield className="h-7 w-7 text-[#0f4b37]" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-[#123d32] mb-2">Autentikasi Dua Faktor</h3>
            <p className="text-sm text-[#7b8479] leading-relaxed mb-6">
              Fitur autentikasi dua faktor menambahkan lapisan keamanan tambahan pada akun Anda.
              Saat ini fitur ini {keamanan ? 'aktif' : 'nonaktif'}.
            </p>
            <button type="button" onClick={() => setShowKeamananInfo(false)}
              className="w-full rounded-xl bg-[#0f4b37] py-2.5 text-sm font-bold text-white hover:bg-[#0a3628] transition">Mengerti</button>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-[#123c2f] font-hanken">
        <div className="flex min-h-screen flex-col lg:flex-row">
          <aside className={buyerSidebarClass}>
            <div>
              <div className="flex items-center justify-between px-5 py-4 lg:px-8 lg:py-0">
                <img src="/images/Logo sidebar.png" alt="Abis.in" className="h-12 w-auto object-contain lg:h-16" />
              </div>

              <nav className="flex flex-col gap-2 pb-4 pt-2 lg:pb-0 lg:pt-0">
                {sidebarItems.map(({ label, icon: Icon, active, path }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => goTo(path)}
                    className={`flex items-center gap-3 py-4 font-semibold transition-colors ${active
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

          <main className={`${buyerContentClass} px-4 py-6 sm:px-6 lg:px-8`}>
            <div className="mx-auto max-w-[1200px]">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h1 className={`${buyerPageTitleClass} font-bold`}>Profil & Pengaturan</h1>
                  <div className="mt-4 flex max-w-[320px] items-center gap-3 rounded-full border border-[#e6e2d7] bg-[#faf8f1] px-4 py-2 shadow-sm">
                    <Search className="h-4 w-4 text-[#6a756d]" />
                    <input
                      type="text"
                      placeholder="Cari Transaksi..."
                      className="w-full bg-transparent text-sm text-[#123d32] outline-none placeholder:text-[#7b8479]"
                    />
                  </div>
                </div>

                <div className="hidden items-center gap-3 rounded-full bg-[#f1efe9] px-3 py-2 shadow-[inset_0_0_0_1px_rgba(18,61,50,0.08)] sm:flex">
                  <div className="text-right leading-tight">
                    <div className="text-[12px] font-semibold text-[#123d32]">{userName}</div>
                    <div className="text-[10px] text-[#123d32]/70">{userRole}</div>
                  </div>
                  <Bell className="h-5 w-5 text-[#123d32]" />
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e7e1d9] text-xs font-bold text-[#123d32]">{initials}</div>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <section className="rounded-[1.4rem] bg-[#0f4b37] px-5 py-5 text-white shadow-[0_10px_20px_rgba(15,75,55,0.12)]">
                  <div className="flex items-start gap-5">
                    <div className="flex h-[105px] w-[105px] items-center justify-center rounded-[1rem] bg-[#f5f3e8] text-[#123d32] shadow-sm">
                      <span className="text-[2rem] font-bold tracking-[-0.05em]">{initials}</span>
                    </div>

                    <div className="grid flex-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-[0.72rem] text-white/55">Nama Lengkap</p>
                        <p className="mt-1 font-literata text-[1.35rem] font-bold leading-tight">{userName}</p>
                      </div>
                      <div>
                        <p className="text-[0.72rem] text-white/55">Email</p>
                        <p className="mt-1 text-[0.96rem] font-semibold underline decoration-white/20 underline-offset-2">
                          {userEmail || 'Belum diisi'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[0.72rem] text-white/55">Telepon</p>
                        <p className="mt-1 text-[0.96rem] font-semibold">{userPhone || 'Belum diisi'}</p>
                      </div>
                      <div>
                        <p className="text-[0.72rem] text-white/55">Alamat</p>
                        <p className="mt-1 text-[0.96rem] font-semibold">{userAddress || 'Belum diisi'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      type="button"
                      id="btn-edit-profil"
                      onClick={openEdit}
                      className="rounded-full bg-[#f5f3e8] px-5 py-2 text-sm font-semibold text-[#123d32] shadow-sm transition hover:bg-white active:scale-95"
                    >
                      Edit Profil
                    </button>
                  </div>
                </section>

                <div className="space-y-4">
                  <section className="rounded-[1.25rem] bg-white px-5 py-5 shadow-[0_10px_20px_rgba(18,61,50,0.08)]">
                    {/* Header row: label + toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#d56c55]">Radius Pencarian Default</p>
                        <p className="text-xs text-[#7b8479] mt-0.5">
                          {radiusEnabled ? `Aktif · ${radiusValue} km` : 'Nonaktif'}
                        </p>
                      </div>
                      {/* Toggle switch */}
                      <button
                        type="button"
                        onClick={() => setRadiusEnabled((v) => !v)}
                        aria-label="Toggle radius pencarian"
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${radiusEnabled ? 'bg-[#0f4b37]' : 'bg-gray-300'
                          }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${radiusEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                      </button>
                    </div>

                    {/* Slider — only visible when enabled */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ${radiusEnabled ? 'max-h-40 mt-4 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                        }`}
                    >
                      <style>{`
                      .radius-slider::-webkit-slider-thumb { appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #0f4b37; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.25); }
                      .radius-slider::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: #0f4b37; cursor: pointer; border: none; box-shadow: 0 1px 4px rgba(0,0,0,0.25); }
                    `}</style>
                      <input
                        type="range"
                        min="1"
                        max="25"
                        value={radiusValue}
                        onChange={(e) => setRadiusValue(Number(e.target.value))}
                        className="radius-slider w-full h-2 rounded-full appearance-none cursor-pointer bg-[#e2e0d8] accent-[#0f4b37]"
                      />
                      <div className="mt-2 flex justify-between text-xs text-[#7b8479]">
                        <span>1 km</span>
                        <span className="font-semibold text-[#0f4b37]">{radiusValue} km</span>
                        <span>25 km</span>
                      </div>
                      <p className="mt-3 text-xs text-[#7b8479] leading-relaxed">
                        Hasil pencarian akan diprioritaskan dalam radius <span className="font-semibold text-[#0f4b37]">{radiusValue} km</span> dari lokasi Anda.
                      </p>
                    </div>

                    {/* Hint text when disabled */}
                    {!radiusEnabled && (
                      <p className="mt-3 text-xs text-[#7b8479] leading-relaxed">
                        Aktifkan untuk memprioritaskan hasil pencarian berdasarkan jarak.
                      </p>
                    )}
                  </section>

                  <section className="rounded-[1.25rem] bg-white px-5 py-5 shadow-[0_10px_20px_rgba(18,61,50,0.08)]">
                    {/* Notifikasi Push */}
                    <div className="flex items-center justify-between gap-4 border-b border-[#ece9df] pb-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full transition ${pushNotif ? 'bg-[#0f4b37]/10' : 'bg-gray-100'}`}>
                          <Bell className={`h-4 w-4 ${pushNotif ? 'text-[#0f4b37]' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <p className="text-[0.95rem] font-semibold text-[#d56c55]">Notifikasi Push</p>
                          <p className="text-xs text-[#7b8479]">{pushNotif ? 'Aktif · Terima update real-time' : 'Nonaktif'}</p>
                        </div>
                      </div>
                      <ToggleSwitch id="toggle-notif" value={pushNotif} onChange={() => setPushNotif((v) => !v)} />
                    </div>

                    {/* Keamanan */}
                    <div className="flex items-center justify-between gap-4 pt-4">
                      <button type="button" onClick={() => setShowKeamananInfo(true)}
                        className="flex items-center gap-3 text-left hover:opacity-75 transition">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full transition ${keamanan ? 'bg-[#0f4b37]/10' : 'bg-gray-100'}`}>
                          {keamanan
                            ? <Shield className="h-4 w-4 text-[#0f4b37]" />
                            : <Lock className="h-4 w-4 text-gray-400" />}
                        </div>
                        <div>
                          <p className="text-[0.95rem] font-semibold text-[#d56c55]">Keamanan</p>
                          <p className="text-xs text-[#7b8479]">{keamanan ? 'Aktif · Autentikasi dua faktor' : 'Autentikasi dua faktor'}</p>
                        </div>
                      </button>
                      <ToggleSwitch id="toggle-keamanan" value={keamanan} onChange={() => setKeamanan((v) => !v)} />
                    </div>
                  </section>
                </div>
              </div>

              <div className="mt-8 flex items-end justify-between gap-4 border-b border-[#d9d7c9] pb-3">
                <h2 className="font-literata text-[2rem] font-bold leading-none text-[#123d32]">Riwayat Rating</h2>
                <button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-[#123d32] hover:text-abisOrange">
                  Lihat Semua
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {ratingCards.length > 0 ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {ratingCards.map((card) => (
                    <article key={card.id} className="rounded-[1.15rem] bg-white p-4 shadow-[0_8px_18px_rgba(18,61,50,0.08)]">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e2e1dd] text-xs font-bold text-[#123d32]" />
                        <div>
                          <h3 className="text-[0.95rem] font-semibold text-[#d56c55]">{card.title}</h3>
                          <p className="text-[0.72rem] text-[#7b8479]">{card.date}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-1 text-[#c15d49]">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={index} className="h-4 w-4 fill-current" />
                        ))}
                      </div>

                      <p className="mt-3 text-sm leading-relaxed text-[#7b8479]">“{card.text}”</p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[1.15rem] border border-dashed border-[#d9d7c9] bg-white px-5 py-8 text-center shadow-[0_8px_18px_rgba(18,61,50,0.06)]">
                  <p className="text-[1rem] font-semibold text-[#123d32]">Belum ada riwayat rating</p>
                  <p className="mt-2 text-sm text-[#69766c]">Saat akun pembeli memberi penilaian sungguhan, data akan tampil di sini.</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
