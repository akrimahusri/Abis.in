import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PenjualLayout from '../../layouts/PenjualLayout'
import { Wallet, Clock, Edit2, Trash2, AlertTriangle, ChevronRight, Plus, Check, X, RefreshCw, ShoppingBag, CheckCircle2, XCircle, User, Phone, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getFoodImageUrl, resolveFoodImageUrl, DEFAULT_FOOD_IMAGE } from '../../lib/storage'

type PostingItem = {
  id: string
  nama_makanan: string
  harga: number
  status: string
  jumlah: number | null
  batas_waktu_ambil: string | null
  foto_url: string | null
}

type SellerOrderItem = {
  id: string
  postinganId: string
  buyerId: string
  buyerName: string
  buyerPhone: string
  foodTitle: string
  price: number
  fotoUrl: string | null
  status: 'menunggu' | 'terkonfirmasi' | 'selesai' | 'dibatalkan'
  createdAt: string
}

export default function PenjualDashboard() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<PostingItem[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  
  // Orders State
  const [incomingOrders, setIncomingOrders] = useState<SellerOrderItem[]>([])
  const [orderTab, setOrderTab] = useState<'Semua' | 'Menunggu' | 'Terkonfirmasi' | 'Selesai'>('Semua')
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  // Toast & Delete Modal states
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 3500)
  }

  const [totalIncome, setTotalIncome] = useState(0)

  const fetchPosts = async () => {
    setLoadingPosts(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      setPosts([])
      setIncomingOrders([])
      setLoadingPosts(false)
      return
    }

    const { data, error } = await supabase
      .from('postingan_makanan')
      .select('id, nama_makanan, harga, status, jumlah, batas_waktu_ambil, foto_url')
      .eq('penjual_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error || !data) {
      setPosts([])
      setIncomingOrders([])
    } else {
      setPosts(data as PostingItem[])

      const postingIds = data.map((p) => p.id)
      if (postingIds.length > 0) {
        const { data: txs } = await supabase
          .from('transaksi_pembelian')
          .select('id, postingan_id, pembeli_id, status, created_at')
          .in('postingan_id', postingIds)
          .order('created_at', { ascending: false })

        if (txs && txs.length > 0) {
          const postingMap = new Map(data.map((p) => [p.id, p]))
          const buyerIds = [...new Set(txs.map((t) => t.pembeli_id).filter(Boolean))]

          let buyerProfilesMap = new Map()
          if (buyerIds.length > 0) {
            const { data: buyers } = await supabase
              .from('profiles')
              .select('id, name, email, telepon')
              .in('id', buyerIds)

            if (buyers) {
              buyerProfilesMap = new Map(buyers.map((b) => [b.id, b]))
            }
          }

          const mappedOrders: SellerOrderItem[] = txs.map((tx) => {
            const posting = postingMap.get(tx.postingan_id)
            const buyer = buyerProfilesMap.get(tx.pembeli_id)

            return {
              id: tx.id,
              postinganId: tx.postingan_id,
              buyerId: tx.pembeli_id,
              buyerName: buyer?.name || buyer?.email?.split('@')[0] || 'Pembeli Abis.in',
              buyerPhone: buyer?.telepon || '-',
              foodTitle: posting?.nama_makanan || 'Makanan Surplus',
              price: Number(posting?.harga || 0),
              fotoUrl: posting?.foto_url || null,
              status: (tx.status as any) || 'menunggu',
              createdAt: new Date(tx.created_at).toLocaleString('id-ID', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              }),
            }
          })

          setIncomingOrders(mappedOrders)

          const income = txs.reduce((acc, curr) => {
            if (curr.status === 'selesai') {
              const p = postingMap.get(curr.postingan_id)
              return acc + Number(p?.harga || 0)
            }
            return acc
          }, 0)
          setTotalIncome(income)

          // Auto-sync status 'habis' for postings whose active orders equal or exceed posted stock
          const activeOrderCounts = new Map<string, number>()
          mappedOrders.forEach((o) => {
            if (o.status !== 'dibatalkan') {
              activeOrderCounts.set(o.postinganId, (activeOrderCounts.get(o.postinganId) || 0) + 1)
            }
          })

          for (const post of data) {
            const ordered = activeOrderCounts.get(post.id) || 0
            if (ordered > 0 && post.status !== 'habis' && post.status !== 'tidak_layak_konsumsi') {
              const remStock = Math.max(0, (post.jumlah ?? 0) - ordered)
              const updatedStatus = remStock <= 0 ? 'habis' : post.status
              if (updatedStatus === 'habis' || remStock !== post.jumlah) {
                await supabase
                  .from('postingan_makanan')
                  .update({ jumlah: remStock, status: updatedStatus })
                  .eq('id', post.id)
              }
            }
          }
        } else {
          setIncomingOrders([])
        }
      }
    }

    setLoadingPosts(false)
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  // Update Order Status Handler
  const handleUpdateOrderStatus = async (orderId: string, newStatus: 'terkonfirmasi' | 'selesai' | 'dibatalkan') => {
    setUpdatingOrderId(orderId)
    try {
      const { error } = await supabase
        .from('transaksi_pembelian')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) {
        showToast(`Gagal memproses status: ${error.message}`)
      } else {
        const messages = {
          terkonfirmasi: 'Pesanan berhasil disetujui! Pembeli dapat mengambil makanan.',
          selesai: 'Pesanan telah diselesaikan & diambil pembeli.',
          dibatalkan: 'Pesanan telah dibatalkan.',
        }
        showToast(messages[newStatus])
        await fetchPosts()
      }
    } catch (err: any) {
      showToast('Terjadi kesalahan saat memperbarui status pesanan.')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  // Delete Post Handler
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        showToast('Sesi login tidak ditemukan. Silakan masuk ulang.')
        setIsDeleting(false)
        setDeleteTarget(null)
        return
      }

      await supabase
        .from('transaksi_pembelian')
        .delete()
        .eq('postingan_id', deleteTarget.id)

      await supabase
        .from('pasokan_maggot')
        .delete()
        .eq('postingan_id', deleteTarget.id)

      const { data, error } = await supabase
        .from('postingan_makanan')
        .delete()
        .eq('id', deleteTarget.id)
        .select()

      if (error) {
        showToast(`Gagal menghapus dari database: ${error.message}`)
      } else if (!data || data.length === 0) {
        const { data: fbData, error: fbErr } = await supabase
          .from('postingan_makanan')
          .delete()
          .match({ id: deleteTarget.id, penjual_id: session.user.id })
          .select()

        if (fbErr || !fbData || fbData.length === 0) {
          const { error: updateErr } = await supabase
            .from('postingan_makanan')
            .update({ status: 'diambil_maggot' })
            .eq('id', deleteTarget.id)

          if (updateErr) {
            showToast(`Gagal menghapus dari database. Hak akses RLS menolak penghapusan.`)
            return
          }
        }
      }

      await fetchPosts()
      showToast(`Postingan "${deleteTarget.title || 'Makanan'}" berhasil dihapus permanen.`)
    } catch (err: any) {
      showToast(`Terjadi kesalahan: ${err?.message || 'Gagal menghapus postingan.'}`)
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  // Delete All Posts Handler
  const handleDeleteAllPosts = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus seluruh postingan Anda secara permanen dari database?')) return
    setIsDeleting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: myPosts } = await supabase
          .from('postingan_makanan')
          .select('id')
          .eq('penjual_id', session.user.id)

        if (myPosts && myPosts.length > 0) {
          const ids = myPosts.map((p) => p.id)
          await supabase.from('transaksi_pembelian').delete().in('postingan_id', ids)
          await supabase.from('pasokan_maggot').delete().in('postingan_id', ids)
        }

        const { error } = await supabase
          .from('postingan_makanan')
          .delete()
          .eq('penjual_id', session.user.id)

        if (error) {
          showToast(`Gagal menghapus dari database: ${error.message}`)
        } else {
          await fetchPosts()
          showToast('Seluruh postingan berhasil dihapus permanen dari database.')
        }
      }
    } catch (err: any) {
      showToast('Gagal menghapus postingan.')
    } finally {
      setIsDeleting(false)
    }
  }

  const postingCards = useMemo(() => {
    if (posts.length === 0) {
      return []
    }

    return posts.map((post, index) => {
      const activeOrders = incomingOrders.filter(
        (o) => o.postinganId === post.id && o.status !== 'dibatalkan'
      ).length
      const initialStock = post.jumlah ?? 0
      const remainingStock = Math.max(0, initialStock - activeOrders)

      const isHabis =
        (post.jumlah !== null && post.jumlah <= 0) ||
        post.status === 'habis' ||
        remainingStock <= 0

      const isExpired = post.status === 'tidak_layak_konsumsi' || post.status === 'diambil_maggot'

      let label = 'Layak Jual'
      let badgeStyle = 'bg-[#0e2718]/90 text-white'
      let desc = 'Postingan makanan aktif dari akun penjual Anda.'

      if (post.status === 'diambil_maggot') {
        label = 'Sudah Diambil'
        badgeStyle = 'bg-blue-700/90 text-white'
        desc = 'Porsi sisa makanan organik ini sudah diambil oleh peternak maggot.'
      } else if (isHabis) {
        label = 'Habis'
        badgeStyle = 'bg-amber-600/90 text-white'
        desc = 'Porsi makanan ini sudah habis dipesan oleh pembeli.'
      } else if (post.status === 'tidak_layak_konsumsi') {
        label = 'Tidak Layak'
        badgeStyle = 'bg-red-400/90 text-white'
        desc = 'Postingan ini berstatus tidak layak konsumsi (Menunggu Peternak).'
      }

      const image = resolveFoodImageUrl(post.foto_url)

      return {
        id: post.id,
        title: post.nama_makanan,
        price: Number(post.harga) || 0,
        desc,
        image,
        status: label,
        badgeStyle,
        isHabis,
        remainingStock,
        timeLeft: post.batas_waktu_ambil ? `Sampai ${new Date(post.batas_waktu_ambil).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}` : `${index + 1} jam`,
        expired: isExpired || isHabis,
      }
    })
  }, [posts, incomingOrders])

  const filteredOrders = useMemo(() => {
    if (orderTab === 'Semua') return incomingOrders
    if (orderTab === 'Menunggu') return incomingOrders.filter((o) => o.status === 'menunggu')
    if (orderTab === 'Terkonfirmasi') return incomingOrders.filter((o) => o.status === 'terkonfirmasi')
    if (orderTab === 'Selesai') return incomingOrders.filter((o) => o.status === 'selesai')
    return incomingOrders
  }, [incomingOrders, orderTab])

  const pendingCount = useMemo(() => incomingOrders.filter((o) => o.status === 'menunggu').length, [incomingOrders])

  const goToPostingForm = () => {
    navigate('/penjual/postingan')
  }

  return (
    <PenjualLayout>
      <div className="space-y-8">
        
        {/* TOAST BANNER */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl bg-[#0e2718] px-5 py-3.5 text-white shadow-2xl border border-emerald-500/40 animate-bounce">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">{toastMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 relative min-h-[280px] overflow-hidden rounded-3xl shadow-sm">
            <div className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&h=600&fit=crop"
                alt="Banner"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-abisGreen/80 via-abisGreen/60 to-transparent" />
            </div>

            <div className="relative z-10 max-w-lg space-y-4 p-10 text-white">
              <h1 className="font-literata text-4xl font-bold leading-tight md:text-5xl">
                Punya surplus <br />makanan hari ini?
              </h1>
              <p className="text-sm text-white/90">
                Kurangi limbah makanan sekaligus ciptakan nilai tambah bagi usaha Anda.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={goToPostingForm}
                  className="flex items-center gap-2 rounded-full bg-abisOrange px-6 py-2.5 font-semibold text-white shadow-md transition hover:bg-[#d67b22]"
                >
                  <Plus className="h-5 w-5" /> Postingan Baru
                </button>
              </div>
            </div>
          </div>

          <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-[#fcd393] p-8 shadow-sm">
            <div className="flex items-start justify-between">
              <h2 className="font-literata text-2xl font-bold text-slate-900">Dompet & Token</h2>
              <Wallet className="h-8 w-8 text-slate-900" />
            </div>

            <div className="mt-8 space-y-1">
              <p className="text-sm font-medium text-slate-700">Pendapatan</p>
              <p className="text-3xl font-bold text-slate-900">Rp {totalIncome.toLocaleString('id-ID')}</p>
            </div>

            <div className="my-6 h-px bg-slate-900/10" />

            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">Jumlah Tokens</p>
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-abisOrange text-xs font-bold text-white shadow-sm">
                  T
                </div>
                <p className="text-3xl font-bold text-slate-900">{totalIncome > 0 ? (totalIncome / 1000).toLocaleString('id-ID') : '0'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* BANNER ACCESS TO SELLER ORDERS PAGE */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-amber-200 bg-amber-50/80 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white font-bold shadow-sm shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-literata text-lg font-bold text-amber-950">Konfirmasi Pesanan Pembeli</h3>
                {pendingCount > 0 && (
                  <span className="rounded-full bg-red-500 px-3 py-0.5 text-xs font-extrabold text-white shadow-sm animate-pulse">
                    {pendingCount} Menunggu Konfirmasi
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-800 mt-1">
                {pendingCount > 0
                  ? `Ada ${pendingCount} pesanan baru dari pembeli yang menunggu persetujuan Anda.`
                  : 'Kelola seluruh pesanan masuk dan status penjemputan makanan surplus di halaman khusus.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/penjual/pesanan')}
            className="w-full sm:w-auto rounded-full bg-abisGreen px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-900 transition flex items-center justify-center gap-2 shrink-0"
          >
            Buka Halaman Pesanan <ChevronRight className="w-4 h-4" />
          </button>
        </section>

        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-literata text-2xl font-bold text-abisGreen">Postingan Akhir Anda</h2>
            {posts.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteAllPosts}
                className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3.5 py-1.5 rounded-full transition border border-red-200"
              >
                <Trash2 className="h-3.5 w-3.5" /> Hapus Semua Postingan
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {loadingPosts ? (
              <div className="col-span-full rounded-[2rem] border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-slate-500">
                Memuat postingan penjual...
              </div>
            ) : postingCards.length > 0 ? postingCards.map((post) => (
              <div key={post.id} className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
                <div className="relative h-48">
                  <img
                    src={post.image}
                    alt={post.title}
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = DEFAULT_FOOD_IMAGE
                    }}
                    className={`h-full w-full object-cover transition duration-300 ${post.expired ? 'grayscale opacity-80' : 'group-hover:scale-105'}`}
                  />
                  <div className="absolute right-4 top-4 z-10">
                    <span
                      className={`rounded-full px-4 py-1.5 text-xs font-bold shadow-sm backdrop-blur-md ${post.badgeStyle}`}
                    >
                      {post.status}
                    </span>
                  </div>
                  {post.expired && <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-bold leading-tight text-slate-900">{post.title}</h3>
                    <p className={`text-sm font-bold ${post.expired ? 'text-slate-400' : 'text-abisOrange'}`}>
                      Rp {post.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <p className="mb-4 flex-1 text-xs leading-relaxed text-slate-500">{post.desc}</p>

                  <div className="-mx-5 mb-4 h-px bg-slate-100 px-5" />

                  <div className="mt-auto flex items-center justify-between">
                    {post.expired ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-red-500">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Kadaluarsa
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                        <Clock className="h-3.5 w-3.5" />
                        Sisa {post.timeLeft}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/penjual/postingan?edit=${post.id}`)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-abisGreen hover:bg-emerald-50 transition"
                        title="Edit Postingan"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ id: post.id, title: post.title })}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Hapus Postingan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full rounded-[2rem] border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-slate-500">
                Belum ada postingan tersimpan. Buat postingan baru untuk menampilkannya di sini.
              </div>
            )}
          </div>
        </div>

        {/* DELETE CONFIRMATION MODAL */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-literata font-bold text-lg text-red-600">Hapus Postingan</h3>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus postingan <strong className="text-slate-900">"{deleteTarget.title}"</strong>? Tindakan ini tidak dapat dibatalkan dan data akan dihapus permanen dari database.
              </p>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-5 py-2.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
                >
                  Batalkan
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-6 py-2.5 rounded-full bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-70"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Menghapus...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" /> Ya, Hapus Postingan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </PenjualLayout>
  )
}

