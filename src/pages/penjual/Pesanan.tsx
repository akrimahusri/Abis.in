import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PenjualLayout from '../../layouts/PenjualLayout'
import { Check, CheckCircle, CheckCircle2, Clock, Phone, RefreshCw, Search, ShoppingBag, User, XCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { resolveFoodImageUrl, DEFAULT_FOOD_IMAGE } from '../../lib/storage'

type OrderItem = {
  id: string
  postinganId: string
  buyerId: string
  buyerName: string
  buyerPhone: string
  buyerEmail: string
  foodTitle: string
  price: number
  fotoUrl: string | null
  status: 'menunggu' | 'terkonfirmasi' | 'selesai' | 'dibatalkan'
  createdAt: string
  rawDate: Date
}

export default function PenjualPesanan() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'Semua' | 'Menunggu' | 'Terkonfirmasi' | 'Selesai' | 'Dibatalkan'>('Semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 3500)
  }

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        setOrders([])
        setLoading(false)
        return
      }

      // Fetch seller posting IDs
      const { data: myPostings } = await supabase
        .from('postingan_makanan')
        .select('id, nama_makanan, harga, foto_url')
        .eq('penjual_id', session.user.id)

      if (!myPostings || myPostings.length === 0) {
        setOrders([])
        setLoading(false)
        return
      }

      const postingIds = myPostings.map((p) => p.id)
      const postingMap = new Map(myPostings.map((p) => [p.id, p]))

      // Fetch transactions for these postings
      const { data: txs, error: txErr } = await supabase
        .from('transaksi_pembelian')
        .select('id, postingan_id, pembeli_id, status, created_at')
        .in('postingan_id', postingIds)
        .order('created_at', { ascending: false })

      if (txErr || !txs || txs.length === 0) {
        setOrders([])
        setLoading(false)
        return
      }

      const buyerIds = [...new Set(txs.map((t) => t.pembeli_id).filter(Boolean))]
      let buyerMap = new Map()

      if (buyerIds.length > 0) {
        const { data: buyers } = await supabase
          .from('profiles')
          .select('id, name, email, telepon')
          .in('id', buyerIds)

        if (buyers) {
          buyerMap = new Map(buyers.map((b) => [b.id, b]))
        }
      }

      const mapped: OrderItem[] = txs.map((tx) => {
        const posting = postingMap.get(tx.postingan_id)
        const buyer = buyerMap.get(tx.pembeli_id)
        const txDate = new Date(tx.created_at)

        return {
          id: tx.id,
          postinganId: tx.postingan_id,
          buyerId: tx.pembeli_id,
          buyerName: buyer?.name || buyer?.email?.split('@')[0] || 'Pembeli Abis.in',
          buyerPhone: buyer?.telepon || '-',
          buyerEmail: buyer?.email || '-',
          foodTitle: posting?.nama_makanan || 'Makanan Surplus',
          price: Number(posting?.harga || 0),
          fotoUrl: posting?.foto_url || null,
          status: (tx.status as any) || 'menunggu',
          createdAt: Number.isNaN(txDate.getTime())
            ? 'Tanggal tidak valid'
            : txDate.toLocaleString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
          rawDate: txDate,
        }
      })

      setOrders(mapped)
    } catch (err) {
      console.warn('Error fetching orders:', err)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleUpdateStatus = async (orderId: string, newStatus: 'terkonfirmasi' | 'selesai' | 'dibatalkan') => {
    setUpdatingOrderId(orderId)
    try {
      const { error } = await supabase
        .from('transaksi_pembelian')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) {
        showToast(`Gagal memproses status: ${error.message}`)
      } else {
        const feedbackMessages = {
          terkonfirmasi: 'Pesanan berhasil disetujui! Pembeli dapat mengambil makanan.',
          selesai: 'Pesanan telah diselesaikan & diambil pembeli.',
          dibatalkan: 'Pesanan telah dibatalkan.',
        }
        showToast(feedbackMessages[newStatus])
        await fetchOrders()
      }
    } catch (err) {
      showToast('Terjadi kesalahan saat memperbarui status pesanan.')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesTab =
        activeTab === 'Semua' ||
        (activeTab === 'Menunggu' && order.status === 'menunggu') ||
        (activeTab === 'Terkonfirmasi' && order.status === 'terkonfirmasi') ||
        (activeTab === 'Selesai' && order.status === 'selesai') ||
        (activeTab === 'Dibatalkan' && order.status === 'dibatalkan')

      const matchesSearch =
        order.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.foodTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesTab && matchesSearch
    })
  }, [orders, activeTab, searchQuery])

  const pendingCount = useMemo(() => orders.filter((o) => o.status === 'menunggu').length, [orders])
  const confirmedCount = useMemo(() => orders.filter((o) => o.status === 'terkonfirmasi').length, [orders])
  const completedCount = useMemo(() => orders.filter((o) => o.status === 'selesai').length, [orders])

  return (
    <PenjualLayout>
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl bg-[#0e2718] px-5 py-3.5 text-white shadow-2xl border border-emerald-500/40 animate-bounce">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      <div className="mx-auto max-w-[1200px] py-6 space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3.5 py-1 text-xs font-bold text-amber-800 border border-amber-300">
              <ShoppingBag className="w-4 h-4" /> Konfirmasi & Kelola Pesanan Pembeli
            </div>
            <h1 className="mt-2 font-literata text-3xl md:text-4xl font-bold leading-tight text-[#1b4332]">
              Pesanan Masuk
            </h1>
            <p className="text-sm text-slate-500">
              Periksa detail pesanan dari pembeli, setujui penjemputan, dan selesaikan transaksi.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchOrders}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:border-abisGreen hover:text-abisGreen shadow-sm transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
            </button>
          </div>
        </div>

        {/* SUMMARY STAT CARDS */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Menunggu Konfirmasi</p>
            <p className="mt-2 font-literata text-3xl font-bold text-amber-900">{pendingCount} Pesanan</p>
            <p className="mt-1 text-xs text-amber-700">Perlu persetujuan Anda agar dapat diambil</p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-800">Siap Diambil</p>
            <p className="mt-2 font-literata text-3xl font-bold text-blue-900">{confirmedCount} Pesanan</p>
            <p className="mt-1 text-xs text-blue-700">Disetujui, menunggu kedatangan pembeli</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Selesai</p>
            <p className="mt-2 font-literata text-3xl font-bold text-emerald-900">{completedCount} Pesanan</p>
            <p className="mt-1 text-xs text-emerald-700">Transaksi selesai diserahkan</p>
          </div>
        </div>

        {/* FILTER & SEARCH BAR */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
          <div className="flex flex-wrap gap-2">
            {(['Semua', 'Menunggu', 'Terkonfirmasi', 'Selesai', 'Dibatalkan'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  activeTab === tab
                    ? 'bg-[#1b4332] text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-[#1b4332]'
                }`}
              >
                {tab}
                {tab === 'Menunggu' && pendingCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] text-slate-900 font-extrabold">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pembeli atau makanan..."
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs outline-none focus:border-[#1b4332]"
            />
          </div>
        </div>

        {/* ORDER CARDS GRID */}
        {loading ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#1b4332] mb-3" />
            <p className="text-sm font-semibold">Memuat pesanan masuk dari pembeli...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-[#1b4332]"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-[#1b4332] font-bold text-xs">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 leading-none">{order.buyerName}</p>
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {order.buyerPhone}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'menunggu'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : order.status === 'terkonfirmasi'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : order.status === 'selesai'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                    >
                      {order.status === 'menunggu'
                        ? 'Menunggu'
                        : order.status === 'terkonfirmasi'
                        ? 'Siap Diambil'
                        : order.status === 'selesai'
                        ? 'Selesai'
                        : 'Dibatalkan'}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <img
                      src={resolveFoodImageUrl(order.fotoUrl)}
                      alt={order.foodTitle}
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = DEFAULT_FOOD_IMAGE
                      }}
                      className="h-20 w-20 rounded-2xl object-cover border border-slate-100 shadow-sm"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-base text-slate-900 leading-snug">{order.foodTitle}</h3>
                      <p className="text-sm font-extrabold text-[#d64b3b] mt-1">
                        Rp {order.price.toLocaleString('id-ID')}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {order.createdAt}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between gap-2">
                  {order.status === 'menunggu' && (
                    <>
                      <button
                        type="button"
                        disabled={updatingOrderId === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'terkonfirmasi')}
                        className="flex-1 py-2.5 px-4 rounded-full bg-[#1b4332] text-white text-xs font-bold hover:bg-[#14342a] transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        {updatingOrderId === order.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> Setujui Pesanan
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={updatingOrderId === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'dibatalkan')}
                        className="py-2.5 px-4 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 transition"
                      >
                        Tolak
                      </button>
                    </>
                  )}

                  {order.status === 'terkonfirmasi' && (
                    <>
                      <button
                        type="button"
                        disabled={updatingOrderId === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'selesai')}
                        className="flex-1 py-2.5 px-4 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        {updatingOrderId === order.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" /> Tandai Selesai (Diambil)
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={updatingOrderId === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'dibatalkan')}
                        className="py-2.5 px-4 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 transition"
                      >
                        Batalkan
                      </button>
                    </>
                  )}

                  {order.status === 'selesai' && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/70 px-4 py-2 rounded-full border border-emerald-300 w-full justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Transaksi Berhasil Selesai
                    </div>
                  )}

                  {order.status === 'dibatalkan' && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-100/70 px-4 py-2 rounded-full border border-red-300 w-full justify-center">
                      <XCircle className="w-4 h-4 text-red-500" /> Pesanan Dibatalkan
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Belum Ada Pesanan Masuk</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              Pesanan baru dari pembeli yang mengambil makanan surplus Anda akan muncul otomatis di halaman ini.
            </p>
          </div>
        )}
      </div>
    </PenjualLayout>
  )
}
