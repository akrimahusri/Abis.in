import { useEffect, useState } from 'react'
import { ArrowDownLeft, ChevronRight, Wallet } from 'lucide-react'
import PenjualLayout from '../../layouts/PenjualLayout'
import { supabase } from '../../lib/supabase'
import { resolveFoodImageUrl, DEFAULT_FOOD_IMAGE } from '../../lib/storage'

type TransactionItem = {
  date: string
  item: string
  type: string
  amount: string
  status: string
  fotoUrl: string
}

export default function PenjualHistory() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [saldoAktif, setSaldoAktif] = useState(0)
  const [pendapatanBulanIni, setPendapatanBulanIni] = useState(0)
  const [totalDanaCair, setTotalDanaCair] = useState(0)

  useEffect(() => {
    const fetchHistoryData = async () => {
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          setLoading(false)
          return
        }

        // Fetch postings belonging to seller
        const { data: postings } = await supabase
          .from('postingan_makanan')
          .select('id, nama_makanan, harga, foto_url')
          .eq('penjual_id', session.user.id)

        if (!postings || postings.length === 0) {
          setLoading(false)
          return
        }

        const postingIds = postings.map((p) => p.id)
        const postingMap = new Map(postings.map((p) => [p.id, p]))

        // Fetch transactions for these postings
        const { data: txs } = await supabase
          .from('transaksi_pembelian')
          .select('id, status, created_at, postingan_id')
          .in('postingan_id', postingIds)
          .order('created_at', { ascending: false })

        if (txs && txs.length > 0) {
          let totalSaldo = 0
          let totalBulan = 0

          const mapped: TransactionItem[] = txs.map((tx) => {
            const p = postingMap.get(tx.postingan_id)
            const harga = Number(p?.harga || 0)
            if (tx.status === 'selesai') {
              totalSaldo += harga
              totalBulan += harga
            }

            const formattedDate = new Date(tx.created_at).toLocaleString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })

            return {
              date: formattedDate,
              item: p?.nama_makanan || 'Makanan Surplus',
              type: 'Penjualan',
              amount: `+ Rp ${harga.toLocaleString('id-ID')}`,
              status: tx.status === 'selesai' ? 'Selesai' : tx.status === 'dibatalkan' ? 'Dibatalkan' : 'Proses',
              fotoUrl: resolveFoodImageUrl(p?.foto_url, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=120&h=120&fit=crop'),
            }
          })

          setTransactions(mapped)
          setSaldoAktif(totalSaldo)
          setPendapatanBulanIni(totalBulan)
          setTotalDanaCair(Math.floor(totalSaldo * 0.8))
        }
      } catch (err) {
        console.warn('History fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistoryData()
  }, [])

  return (
    <PenjualLayout>
      <div className="mx-auto max-w-[1100px] py-6">
        <div className="mb-6">
          <h1 className="font-literata text-[2.2rem] font-bold leading-none text-[#1b4332]">Dompet & Saldo Penjual</h1>
          <p className="mt-2 text-[1rem] text-[#42564e]">Kelola pendapatan dan pencairan dana usaha surplus Anda.</p>
        </div>

        <div className="rounded-[1.5rem] border border-[#dfe3dc] bg-[#f8f7f2] p-4 shadow-[0_1px_0_rgba(29,54,42,0.04)] sm:p-5">
          <div className="rounded-[1.5rem] bg-[#123c2f] px-5 py-6 sm:px-8 sm:py-7">
            <p className="text-center text-[0.78rem] font-bold uppercase tracking-[0.12em] text-[#dfe6df]">Total Saldo Aktif</p>

            <div className="mt-5 flex items-center justify-center gap-2 text-center text-[#f6f6ee]">
              <span className="text-[0.9rem] font-medium">Rp</span>
              <span className="font-literata text-[3rem] font-bold leading-none sm:text-[4rem]">
                {loading ? '...' : saldoAktif.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-[0.9rem] border border-[#caf0e5] bg-[#dff4ee] px-4 py-3 text-[#1b4332] shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#cfeae0] text-[#1b4332]">
                    <ArrowDownLeft className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#1b4332]/70">Pendapatan Bulan Ini</p>
                    <p className="mt-1 text-[1.1rem] font-bold">Rp {pendapatanBulanIni.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-[0.9rem] border border-[#caf0e5] bg-[#dff4ee] px-4 py-3 text-[#1b4332] shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#cfeae0] text-[#1b4332]">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#1b4332]/70">Total Dana Cair</p>
                    <p className="mt-1 text-[1.1rem] font-bold">Rp {totalDanaCair.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-[#dfe3dc] bg-[#f8f7f2] p-3 shadow-[0_1px_0_rgba(29,54,42,0.04)] sm:p-4">
          <h2 className="px-2 py-3 font-literata text-[2rem] font-bold leading-none text-[#1b4332]">Riwayat Transaksi</h2>

          <div className="overflow-hidden rounded-[1.2rem] border border-[#dfe3dc] bg-white">
            <div className="grid grid-cols-[1.1fr_1.8fr_1.1fr_1.1fr_0.9fr] gap-2 bg-[#dff4ee] px-4 py-3 text-center text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#1b4332]">
              <span className="text-left">Tanggal</span>
              <span className="text-left">Deskripsi</span>
              <span>Type</span>
              <span>Jumlah</span>
              <span>Status</span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-slate-500">Memuat transaksi dompet...</div>
            ) : transactions.length > 0 ? (
              transactions.map((item, index) => (
                <div key={index} className="grid grid-cols-[1.1fr_1.8fr_1.1fr_1.1fr_0.9fr] gap-2 items-center border-t border-[#e3e7e1] bg-white px-4 py-3 text-[0.9rem] text-[#1b4332]">
                  <span className="text-left text-[#4a5a53]">{item.date}</span>

                  <div className="flex items-center gap-3 text-left">
                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md bg-[#dfe4dd]">
                      <img
                        src={item.fotoUrl}
                        alt={item.item}
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = DEFAULT_FOOD_IMAGE
                        }}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="font-medium">{item.item}</span>
                  </div>

                  <span className="text-center text-[#4a5a53]">{item.type}</span>
                  <span className="text-center font-semibold text-[#1b4332]">{item.amount}</span>
                  <span className="text-center font-bold text-[#1b4332]">{item.status}</span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-slate-500">Belum ada riwayat transaksi penjualan.</div>
            )}
          </div>

          <div className="mt-4 flex justify-center">
            <button type="button" className="inline-flex items-center gap-2 rounded-full border border-[#dfe3dc] bg-white px-5 py-2.5 text-sm font-semibold text-[#1b4332] shadow-sm transition hover:border-[#1b4332]">
              Lihat Seluruh Riwayat
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </PenjualLayout>
  )
}
