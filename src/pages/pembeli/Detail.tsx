import { useEffect, useMemo, useState } from 'react'
import { Bell, ChevronRight, Clock3, HelpCircle, Home, LogOut, Search, ShoppingBag, Star, UserRound } from 'lucide-react'
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

export default function PembeliDetail() {
  const navigate = useNavigate()
  const [userName, setUserName] = useState('Pembeli')
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState('Pembeli Aktif')

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        return
      }

      const { data, error } = await supabase.from('profiles').select('email, role, nama_usaha').eq('id', session.user.id).single()

      if (!error && data) {
        setUserName(session.user.email?.split('@')[0] || data.nama_usaha || 'Pembeli')
        setUserEmail(data.email || session.user.email || '')
        setUserRole(data.role === 'pembeli' ? 'Pembeli Aktif' : data.role || 'Pembeli Aktif')
      } else {
        setUserName(session.user.email?.split('@')[0] || 'Pembeli')
        setUserEmail(session.user.email || '')
      }
    }

    fetchProfile()
  }, [])

  const initials = useMemo(() => {
    const parts = userName.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }

    return userName.slice(0, 2).toUpperCase()
  }, [userName])

  const goTo = (path: string) => {
    navigate(path)
  }

  const handleLogout = async () => {
    await signOutUser()
    navigate('/auth')
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
              {sidebarItems.map(({ label, icon: Icon, active, path }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => goTo(path)}
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
                      <p className="mt-1 text-[0.96rem] font-semibold">Belum diisi</p>
                    </div>
                    <div>
                      <p className="text-[0.72rem] text-white/55">Alamat</p>
                      <p className="mt-1 text-[0.96rem] font-semibold">Belum diisi</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button type="button" className="rounded-full bg-[#f5f3e8] px-4 py-2 text-sm font-semibold text-[#123d32] shadow-sm transition hover:bg-white">
                    Edit Profil
                  </button>
                </div>
              </section>

              <div className="space-y-4">
                <section className="rounded-[1.25rem] bg-white px-5 py-5 shadow-[0_10px_20px_rgba(18,61,50,0.08)]">
                  <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#d56c55]">Radius Pencarian Default</p>
                  <div className="mt-5 h-2 rounded-full bg-[#e2e0d8]">
                    <div className="h-2 w-[34%] rounded-full bg-[#0f4b37]" />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-[#7b8479]">
                    <span>1 km</span>
                    <span>25 km</span>
                  </div>
                  <p className="mt-5 text-sm text-[#7b8479]">Kami akan memprioritaskan hasil pencarian dalam radius ini untuk mengoptimalkan pengalaman komunitas Anda.</p>
                </section>

                <section className="rounded-[1.25rem] bg-white px-5 py-5 shadow-[0_10px_20px_rgba(18,61,50,0.08)]">
                  <div className="flex items-center justify-between gap-4 border-b border-[#ece9df] pb-4">
                    <div>
                      <p className="text-[0.95rem] font-semibold text-[#d56c55]">Notifikasi Push</p>
                      <p className="text-xs text-[#7b8479]">Terima update real-time</p>
                    </div>
                    <div className="h-5 w-10 rounded-full bg-[#0f4b37] p-0.5">
                      <div className="h-4 w-4 rounded-full bg-white translate-x-5" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-4">
                    <div>
                      <p className="text-[0.95rem] font-semibold text-[#d56c55]">Keamanan</p>
                      <p className="text-xs text-[#7b8479]">Autentikasi dua faktor</p>
                    </div>
                    <div className="h-5 w-10 rounded-full bg-[#f3f0e4] p-0.5">
                      <div className="h-4 w-4 rounded-full bg-white" />
                    </div>
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
  )
}
