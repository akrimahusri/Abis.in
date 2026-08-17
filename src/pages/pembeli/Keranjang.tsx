import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Clock3, Coffee, HelpCircle, Home, LogOut, MapPin, Minus, Plus, ShoppingBag, Trash2, UserRound, Utensils, Check, CreditCard, RefreshCw, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { signOutUser } from '../../lib/auth'
import { resolveFoodImageUrl, DEFAULT_FOOD_IMAGE } from '../../lib/storage'
import { buyerContentClass, buyerPageTitleClass, buyerSidebarClass } from './styles'

const sidebarItems = [
  { label: 'Beranda', icon: Home, active: false, path: '/pembeli' },
  { label: 'Keranjang', icon: ShoppingBag, active: true, path: '/pembeli/keranjang' },
  { label: 'Riwayat', icon: Clock3, active: false, path: '/pembeli/riwayat' },
  { label: 'Profil', icon: UserRound, active: false, path: '/pembeli/detail' },
]

type CartItem = {
  id: string | number
  postingId?: string
  name: string
  price: number
  quantity: number
  stock?: number
  image: string
  seller?: string
}

const paymentOptions = [
  { name: 'QRIS Instant', desc: 'GoPay, OVO, Dana, ShopeePay', icon: '📱' },
  { name: 'Tunai saat Ambil', desc: 'Bayar langsung di tempat penjual', icon: '💵' },
  { name: 'Transfer Bank', desc: 'BCA, Mandiri, BRI, BNI', icon: '🏦' },
  { name: 'Token Abis.in', desc: 'Tukarkan token saldo Anda', icon: '🪙' },
]

export default function PembeliCart() {
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [noUtensils, setNoUtensils] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('QRIS Instant')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Load Cart from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('abis_cart')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setCartItems(parsed)
        }
      }
    } catch (err) {
      console.warn('Cart load error:', err)
    }
  }, [])

  const subtotal = useMemo(() => cartItems.reduce((total, item) => total + item.price * item.quantity, 0), [cartItems])
  const serviceFee = cartItems.length > 0 ? 3000 : 0
  const discount = cartItems.length > 0 ? 1000 : 0
  const totalPayment = Math.max(0, subtotal + serviceFee - discount)

  const updateQuantity = (id: string | number, delta: number) => {
    setCartItems((previous) => {
      const updated = previous.map((item) => {
        if (item.id === id) {
          const maxStock = item.stock && item.stock > 0 ? item.stock : 99
          const targetQty = item.quantity + delta
          if (targetQty > maxStock) {
            setErrorMsg(`Stok porsi yang tersedia untuk ${item.name} hanya ${maxStock} porsi.`)
            setTimeout(() => setErrorMsg(null), 3500)
            return item
          }
          return { ...item, quantity: Math.max(1, Math.min(maxStock, targetQty)) }
        }
        return item
      })
      localStorage.setItem('abis_cart', JSON.stringify(updated))
      return updated
    })
  }

  const removeItem = (id: string | number) => {
    setCartItems((previous) => {
      const updated = previous.filter((item) => item.id !== id)
      localStorage.setItem('abis_cart', JSON.stringify(updated))
      return updated
    })
  }

  const handleCheckout = async () => {
    if (cartItems.length === 0) return
    setSubmitting(true)
    setErrorMsg(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const insertPayloads = cartItems.map((item) => ({
          pembeli_id: session.user.id,
          postingan_id: item.postingId || String(item.id),
          status: 'menunggu',
        }))

        const { error } = await supabase
          .from('transaksi_pembelian')
          .insert(insertPayloads)

        if (error) {
          console.warn('Checkout Supabase note:', error.message)
        }

        // Decrement stock in postingan_makanan
        for (const item of cartItems) {
          const targetPostingId = item.postingId || String(item.id)
          const { data: currentPost } = await supabase
            .from('postingan_makanan')
            .select('jumlah, status')
            .eq('id', targetPostingId)
            .single()

          if (currentPost) {
            const currentStock = currentPost.jumlah ?? 0
            const remainingStock = Math.max(0, currentStock - item.quantity)
            const newStatus = remainingStock <= 0 ? 'habis' : currentPost.status

            await supabase
              .from('postingan_makanan')
              .update({
                jumlah: remainingStock,
                status: newStatus,
              })
              .eq('id', targetPostingId)
          }
        }
      }

      localStorage.removeItem('abis_cart')
      setCartItems([])
      setSuccessMsg('Pesanan Anda berhasil dibuat dan siap diambil!')

      setTimeout(() => {
        navigate('/pembeli/riwayat')
      }, 1400)
    } catch (err: any) {
      console.error('Checkout error:', err)
      setErrorMsg('Gagal memproses pesanan.')
    } finally {
      setSubmitting(false)
    }
  }

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

        <main className={buyerContentClass}>
          {/* SUCCESS BANNER */}
          {successMsg && (
            <div className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl bg-[#0e2718] px-5 py-3.5 text-white shadow-2xl border border-emerald-500/40 animate-bounce">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold">{successMsg}</span>
            </div>
          )}

          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1200px]">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h1 className={`${buyerPageTitleClass} font-bold`}>Keranjang Pesanan</h1>
                  <p className="mt-3 max-w-2xl text-[0.95rem] text-[#69766c]">
                    Selesaikan pesananmu untuk membantu mengurangi limbah makanan.
                  </p>
                </div>

                <div className="hidden rounded-full bg-[#f2eee4] px-3 py-2 text-sm font-semibold text-[#123d32] shadow-sm sm:inline-flex">
                  Pembeli Aktif
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.08fr_0.72fr]">
                <div className="space-y-5">
                  <section className="rounded-[1.4rem] border border-[#dfddd2] bg-white p-4 shadow-[0_1px_0_rgba(18,61,50,0.04)] sm:p-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#ecf5ef] text-[#0f4b37]">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[0.92rem] font-bold text-[#123d32]">Alamat Pengambilan</p>
                        {cartItems.length > 0 ? (
                          <>
                            <p className="mt-1 text-[0.92rem] font-semibold text-[#123d32]">
                              {cartItems[0].seller || 'Lokasi Mitra Penjual'}
                            </p>
                            <p className="text-[0.76rem] text-[#8a938a]">Ambil sesuai jadwal jam operasional mitra toko.</p>
                          </>
                        ) : (
                          <>
                            <p className="mt-1 text-[0.92rem] font-semibold text-[#123d32]">Belum ada lokasi tersimpan</p>
                            <p className="text-[0.76rem] text-[#8a938a]">Tambahkan item dari beranda untuk mengisi keranjang pembelian.</p>
                          </>
                        )}
                      </div>
                    </div>
                  </section>

                  {cartItems.length > 0 ? (
                    <section className="overflow-hidden rounded-[1.4rem] border border-[#dfddd2] bg-white shadow-[0_1px_0_rgba(18,61,50,0.04)]">
                      <div className="flex items-center justify-between border-b border-[#ece9df] px-4 py-4 sm:px-5">
                        <div className="flex items-center gap-2 text-[#123d32]">
                          <span className="text-base">🏪</span>
                          <h2 className="text-[1.02rem] font-bold">Keranjang Aktif ({cartItems.length} Makanan)</h2>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#d9f0de] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#3a8d54]">
                          <span className="h-2 w-2 rounded-full bg-[#3a8d54]" />
                          Siap Diproses
                        </span>
                      </div>

                      <div className="divide-y divide-[#ece9df]">
                        {cartItems.map((item) => (
                          <article key={item.id} className="grid grid-cols-[72px_1fr] gap-3 px-4 py-3 sm:grid-cols-[92px_1fr] sm:px-5">
                            <img
                              src={resolveFoodImageUrl(item.image)}
                              alt={item.name}
                              onError={(e) => {
                                e.currentTarget.onerror = null
                                e.currentTarget.src = DEFAULT_FOOD_IMAGE
                              }}
                              className="h-[72px] w-[72px] rounded-[0.9rem] object-cover sm:h-[82px] sm:w-[82px]"
                            />

                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                              <div>
                                <h3 className="text-[1rem] font-semibold text-[#123d32]">{item.name}</h3>
                                {item.seller && <p className="text-xs text-slate-500">{item.seller}</p>}
                                <button type="button" onClick={() => removeItem(item.id)} className="mt-2 inline-flex items-center gap-1 text-[0.76rem] font-semibold text-[#e45454] transition hover:text-[#cb3b3b]">
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Hapus
                                </button>
                              </div>

                              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
                                <p className="text-[0.98rem] font-bold text-[#d64b3b]">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
                                <div className="flex items-center rounded-full border border-[#e4e0d6] bg-[#faf8f1] p-1 text-[#6b7268]">
                                  <button type="button" onClick={() => updateQuantity(item.id, -1)} className="flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-white">
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                  <span className="min-w-8 px-2 text-center text-[0.82rem] font-semibold text-[#123d32]">{item.quantity}</span>
                                  <button type="button" onClick={() => updateQuantity(item.id, 1)} className="flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-white">
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>

                      <button type="button" onClick={() => navigate('/pembeli')} className="flex w-full items-center justify-center gap-2 border-t border-[#ece9df] py-3 text-[0.82rem] font-semibold text-[#123d32] transition hover:bg-[#fbfaf5]">
                        Tambah Pesanan Lain
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </section>
                  ) : (
                    <section className="rounded-[1.4rem] border border-dashed border-[#cfd8cf] bg-white p-6 text-center shadow-[0_1px_0_rgba(18,61,50,0.04)] sm:p-8">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ecf5ef] text-[#0f4b37]">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                      <h2 className="mt-4 text-[1.1rem] font-bold text-[#123d32]">Keranjang masih kosong</h2>
                      <p className="mt-2 text-sm leading-relaxed text-[#69766c]">Pilih makanan pilihan Anda dari beranda dan tekan tombol "Ambil" untuk mulai berbelanja.</p>
                      <button type="button" onClick={() => navigate('/pembeli')} className="mt-5 rounded-full bg-[#0f4b37] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b3f2d]">
                        Jelajah Makanan Sekarang
                      </button>
                    </section>
                  )}

                  <section className="rounded-[1.1rem] border border-[#9fceb3] bg-[#a6d5bd] px-4 py-4 shadow-[0_1px_0_rgba(18,61,50,0.04)]">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#123d32]/10 text-[#123d32]">
                        <Utensils className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[0.92rem] font-bold text-[#123d32]">Tanpa Alat Makan</p>
                        <p className="text-[0.76rem] text-[#365348]">Kurangi penggunaan plastik sekali pakai untuk setiap pesanan.</p>
                      </div>
                      <input type="checkbox" checked={noUtensils} onChange={(event) => setNoUtensils(event.target.checked)} className="mt-1 h-5 w-5 rounded border-[#6d9a7e] text-[#0f4b37] focus:ring-[#0f4b37]" />
                    </label>
                  </section>
                </div>

                <aside className="rounded-[1.4rem] border border-[#dfddd2] bg-white p-5 shadow-[0_1px_0_rgba(18,61,50,0.04)]">
                  <h2 className="text-[1.02rem] font-bold text-[#123d32]">Ringkasan Pesanan</h2>

                  <div className="mt-5 space-y-3 text-[0.84rem] text-[#607066]">
                    <div className="flex items-center justify-between">
                      <span>Subtotal ({cartItems.reduce((acc, c) => acc + c.quantity, 0)} item)</span>
                      <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Biaya Layanan</span>
                      <span>Rp {serviceFee.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#e45454]">
                      <span>Diskon Mulia</span>
                      <span>- Rp {discount.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <div className="my-5 h-px bg-[#ece9df]" />

                  <div className="flex items-center justify-between text-[#123d32]">
                    <span className="text-[0.96rem] font-semibold">Total Pembayaran</span>
                    <span className="text-[1.1rem] font-bold text-[#d64b3b]">Rp {totalPayment.toLocaleString('id-ID')}</span>
                  </div>

                  <div className="mt-5">
                    <label className="block text-xs font-bold text-[#123d32] uppercase mb-1">Metode Pembayaran</label>
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(true)}
                      className="flex w-full items-center justify-between rounded-[1rem] border border-[#dfddd2] bg-[#faf8f1] px-4 py-3 text-left text-[#123d32] transition hover:bg-[#f4f1e6]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ecf5ef] text-sm">
                          {paymentOptions.find((p) => p.name === paymentMethod)?.icon || '💳'}
                        </span>
                        <div>
                          <p className="text-[0.88rem] font-bold">{paymentMethod}</p>
                          <p className="text-[0.7rem] text-[#7f887d]">
                            {paymentOptions.find((p) => p.name === paymentMethod)?.desc || 'Pilih cara pembayaran'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#7f887d]" />
                    </button>
                  </div>

                  {errorMsg && (
                    <p className="mt-3 text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={cartItems.length === 0 || submitting}
                    onClick={handleCheckout}
                    className="mt-6 w-full rounded-full bg-[#0f4b37] px-5 py-3.5 text-[0.92rem] font-bold text-white shadow-[0_8px_18px_rgba(15,75,55,0.18)] transition hover:bg-[#0b3f2d] disabled:cursor-not-allowed disabled:bg-[#9eb6ad] disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Memproses Pesanan...
                      </>
                    ) : (
                      'Pesan Sekarang & Ambil'
                    )}
                  </button>

                  <p className="mt-5 text-center text-[0.72rem] leading-relaxed text-[#8a938a]">
                    Dengan menekan tombol, Anda menyetujui Syarat &amp; Ketentuan dari Abis.in
                  </p>
                </aside>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* PAYMENT METHOD MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#fcfaf5] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#ece9df] pb-3">
              <h3 className="font-literata font-bold text-lg text-[#123d32]">Pilih Metode Pembayaran</h3>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {paymentOptions.map((opt) => (
                <div
                  key={opt.name}
                  onClick={() => {
                    setPaymentMethod(opt.name)
                    setShowPaymentModal(false)
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
                    paymentMethod === opt.name
                      ? 'border-[#0f4b37] bg-[#eef6f1] ring-2 ring-[#0f4b37]/10'
                      : 'border-[#dfddd2] bg-white hover:border-[#0f4b37]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-[#123d32]">{opt.name}</p>
                      <p className="text-xs text-[#7f887d]">{opt.desc}</p>
                    </div>
                  </div>
                  {paymentMethod === opt.name && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0f4b37] text-white">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="w-full py-3 rounded-full bg-[#0f4b37] text-white font-bold text-xs hover:bg-[#0b3f2d]"
              >
                Gunakan Pembayaran Ini
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}