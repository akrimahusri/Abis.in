import { useEffect, useMemo, useState } from 'react'
import { Bell, ChevronRight, Clock3, HelpCircle, Home, LogOut, Search, ShoppingBag, Star, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { signOutUser } from '../../lib/auth'
import { buyerContentClass, buyerPageTitleClass, buyerSidebarClass } from './styles'

const sidebarItems = [
  { label: 'Beranda', icon: Home, active: false, path: '/pembeli' },
  { label: 'Keranjang', icon: ShoppingBag, active: false, path: '/pembeli/keranjang' },
  { label: 'Riwayat', icon: Clock3, active: true, path: '/pembeli/riwayat' },
  { label: 'Profil', icon: UserRound, active: false, path: '/pembeli/detail' },
]

type TransactionItem = {
  id: number
  title: string
  seller: string
  status: 'Selesai' | 'Dibatalkan' | 'Menunggu'
  total: number
  date: string
  image: string
}

type TransactionRow = {
  id: string
  status: 'menunggu' | 'terkonfirmasi' | 'selesai' | 'dibatalkan'
  created_at: string
  postingan_id: string
}

type PostingRow = {
  id: string
  nama_makanan: string
  foto_url: string | null
  harga: number | string
  penjual_id: string
}

type SellerProfile = {
  id: string
  nama_usaha: string | null
  email: string | null
}

function formatTransactionDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Tanggal tidak tersedia'
  }

  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PembeliRiwayat() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'Semua' | 'Selesai' | 'Dibatalkan' | 'Menunggu'>('Semua')
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoadingTransactions(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        setTransactions([])
        setLoadingTransactions(false)
        return
      }

      const { data: transactionRows, error: transactionError } = await supabase
        .from('transaksi_pembelian')
        .select('id, status, created_at, postingan_id')
        .eq('pembeli_id', session.user.id)
        .order('created_at', { ascending: false })

      if (transactionError || !transactionRows?.length) {
        setTransactions([])
        setLoadingTransactions(false)
        return
      }

      const typedTransactions = transactionRows as TransactionRow[]
      const postingIds = [...new Set(typedTransactions.map((item) => item.postingan_id))]

      const { data: postingRows } = await supabase
        .from('postingan_makanan')
        .select('id, nama_makanan, foto_url, harga, penjual_id')
        .in('id', postingIds)

      const sellerIds = [...new Set((postingRows ?? []).map((item) => item.penjual_id))]
      let sellerProfiles: SellerProfile[] = []

      if (sellerIds.length > 0) {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('id, nama_usaha, email')
          .in('id', sellerIds)

        sellerProfiles = (profileRows ?? []) as SellerProfile[]
      }

      const postingMap = new Map<string, PostingRow>((postingRows ?? []).map((item) => [item.id, item as PostingRow]))
      const sellerMap = new Map(sellerProfiles.map((item) => [item.id, item]))

      const mappedTransactions = typedTransactions.map((transaction, index) => {
        const posting = postingMap.get(transaction.postingan_id)
        const seller = posting ? sellerMap.get(posting.penjual_id) : null

        return {
          id: index + 1,
          title: posting?.nama_makanan || 'Pesanan tanpa nama',
          seller: seller?.nama_usaha || seller?.email?.split('@')[0] || 'Penjual',
          status:
            transaction.status === 'selesai'
              ? 'Selesai'
              : transaction.status === 'dibatalkan'
                ? 'Dibatalkan'
                : 'Menunggu',
          total: Number(posting?.harga ?? 0),
          date: formatTransactionDate(transaction.created_at),
          image:
            posting?.foto_url?.startsWith('http')
              ? posting.foto_url
              : 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=300&q=80',
        }
      })

      setTransactions(mappedTransactions)
      setLoadingTransactions(false)
    }

    fetchTransactions()
  }, [])

  const filteredTransactions = useMemo(() => {
    if (activeTab === 'Semua') {
      return transactions
    }

    return transactions.filter((item) => item.status === activeTab)
  }, [activeTab])

  const completedCount = useMemo(() => transactions.filter((item) => item.status === 'Selesai').length, [transactions])
  const canceledCount = useMemo(() => transactions.filter((item) => item.status === 'Dibatalkan').length, [transactions])
  const pendingCount = useMemo(() => transactions.filter((item) => item.status === 'Menunggu').length, [transactions])

  const handleLogout = async () => {
    await signOutUser()
    navigate('/auth')
  }

  const goTo = (path: string) => {
    navigate(path)
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
                <h1 className={`${buyerPageTitleClass} font-bold`}>Riwayat Pembelian</h1>
                <p className="mt-3 max-w-2xl text-[0.95rem] text-[#69766c]">Lihat transaksi yang sudah kamu selesaikan atau batalkan.</p>
              </div>

              <div className="hidden items-center gap-3 rounded-full bg-[#f1efe9] px-3 py-2 shadow-[inset_0_0_0_1px_rgba(18,61,50,0.08)] sm:flex">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e7e1d9] text-xs font-bold text-[#123d32]">AN</div>
                <div className="text-right">
                  <div className="text-[12px] font-semibold text-[#123d32]">Anisa</div>
                  <div className="text-[10px] text-[#123d32]/70">Pembeli Aktif</div>
                </div>
                <Bell className="h-5 w-5 text-[#123d32]" />
              </div>
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[1.25rem] bg-[#0f4b37] px-5 py-5 text-white shadow-[0_10px_20px_rgba(15,75,55,0.12)]">
                <p className="text-sm text-white/65">Total transaksi</p>
                <p className="mt-3 font-literata text-[1.7rem] font-bold leading-none">{transactions.length} Pesanan</p>
                <p className="mt-4 max-w-md text-sm text-white/75">Data ini diambil langsung dari riwayat transaksi akun pembeli.</p>
              </div>

              <div className="rounded-[1.25rem] bg-white px-5 py-5 shadow-[0_10px_20px_rgba(18,61,50,0.08)]">
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#d56c55]">Status transaksi</p>
                <p className="mt-3 text-[1.7rem] font-bold text-[#123d32]">{completedCount} selesai</p>
                <p className="mt-4 text-sm text-[#7b8479]">
                  {canceledCount} dibatalkan, {pendingCount} menunggu diproses
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d9d7c9] pb-3">
              <h2 className="font-literata text-[2rem] font-bold leading-none text-[#123d32]">Daftar Transaksi</h2>

              <div className="flex gap-2 rounded-full bg-[#e5e2d4] p-1 text-[#123d32]">
                {(['Semua', 'Selesai', 'Dibatalkan', 'Menunggu'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition ${activeTab === tab ? 'bg-[#f5f3e8] shadow-sm' : 'text-[#123d32]/75 hover:text-[#123d32]'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {loadingTransactions ? (
              <div className="mt-6 rounded-[1.25rem] border border-dashed border-[#d9d7c9] bg-white px-5 py-8 text-center text-sm text-[#69766c] shadow-[0_8px_18px_rgba(18,61,50,0.06)]">
                Memuat riwayat transaksi...
              </div>
            ) : filteredTransactions.length > 0 ? (
              <div className="mt-6 space-y-4">
                {filteredTransactions.map((item) => (
                  <article key={item.id} className="flex flex-col gap-4 rounded-[1.25rem] bg-white p-4 shadow-[0_8px_18px_rgba(18,61,50,0.08)] md:flex-row md:items-center">
                    <img src={item.image} alt={item.title} className="h-[120px] w-[120px] rounded-[1rem] object-cover" />

                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-[0.72rem] font-bold text-white ${item.status === 'Selesai' ? 'bg-[#0f4b37]' : item.status === 'Menunggu' ? 'bg-[#b08b35]' : 'bg-[#d77a7a]'}`}>
                          {item.status}
                        </span>
                      </div>
                      <h3 className="text-[1.1rem] font-semibold text-[#123d32]">{item.title}</h3>
                      <p className="text-sm text-[#7b8479]">{item.seller}</p>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button type="button" className="inline-flex items-center gap-2 rounded-full bg-[#0f4b37] px-4 py-2 text-sm font-semibold text-white">
                          <Star className="h-4 w-4" />
                          Beri Rating
                        </button>
                        <button type="button" className="inline-flex items-center gap-2 rounded-full border border-[#d5b5a7] px-4 py-2 text-sm font-semibold text-[#c47c66]">
                          Laporkan Masalah
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-[#a7a19a]">{item.date}</p>
                      <p className="mt-10 text-sm text-[#a7a19a]">Total Bayar</p>
                      <p className="text-[1.4rem] font-bold text-[#c25d48]">Rp{item.total.toLocaleString('id-ID')}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[1.25rem] border border-dashed border-[#d9d7c9] bg-white px-5 py-8 text-center shadow-[0_8px_18px_rgba(18,61,50,0.06)]">
                <p className="text-[1rem] font-semibold text-[#123d32]">Belum ada riwayat transaksi</p>
                <p className="mt-2 text-sm text-[#69766c]">Daftar ini akan terisi otomatis setelah akun pembeli memiliki transaksi nyata.</p>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <button type="button" className="inline-flex items-center gap-2 rounded-full border border-[#dfe3dc] bg-white px-5 py-2.5 text-sm font-semibold text-[#1b4332] shadow-sm transition hover:border-[#1b4332]">
                Lihat Seluruh Riwayat
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}