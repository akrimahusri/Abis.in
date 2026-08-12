import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PenjualLayout from '../../layouts/PenjualLayout'
import { Wallet, Clock, Edit2, Trash2, AlertTriangle, ChevronRight, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getFoodImageUrl } from '../../lib/storage'

type PostingItem = {
  id: string
  nama_makanan: string
  harga: number
  status: string
  batas_waktu_ambil: string | null
  foto_url: string | null
}

export default function PenjualDashboard() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<PostingItem[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      setLoadingPosts(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        setPosts([])
        setLoadingPosts(false)
        return
      }

      const { data, error } = await supabase
        .from('postingan_makanan')
        .select('id, nama_makanan, harga, status, batas_waktu_ambil, foto_url')
        .eq('penjual_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error || !data) {
        setPosts([])
      } else {
        setPosts(data as PostingItem[])
      }

      setLoadingPosts(false)
    }

    fetchPosts()
  }, [])

  const postingCards = useMemo(() => {
    if (posts.length === 0) {
      return []
    }

    return posts.map((post, index) => {
      const isExpired = post.status === 'tidak_layak_konsumsi' || post.status === 'diambil_maggot'
      const label = isExpired ? 'Tidak Layak' : 'Layak Jual'
      const image = post.foto_url ? (post.foto_url.startsWith('http') ? post.foto_url : getFoodImageUrl(post.foto_url)) : 'https://images.unsplash.com/photo-1548943487-a2e4e43b4859?w=500&h=400&fit=crop'

      return {
        id: post.id,
        title: post.nama_makanan,
        price: Number(post.harga) || 0,
        desc: isExpired ? 'Postingan ini sudah tidak layak jual.' : 'Postingan makanan aktif dari akun penjual Anda.',
        image,
        status: label,
        timeLeft: post.batas_waktu_ambil ? `Sampai ${new Date(post.batas_waktu_ambil).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}` : `${index + 1} jam`,
        expired: isExpired,
      }
    })
  }, [posts])

  const goToPostingForm = () => {
    navigate('/penjual/postingan')
  }

  return (
    <PenjualLayout>
      <div className="space-y-8">
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
              <p className="text-3xl font-bold text-slate-900">Rp 6.000.000,00</p>
            </div>

            <div className="my-6 h-px bg-slate-900/10" />

            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">Jumlah Tokens</p>
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-abisOrange text-xs font-bold text-white shadow-sm">
                  T
                </div>
                <p className="text-3xl font-bold text-slate-900">4,365</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-literata text-2xl font-bold text-abisGreen">Postingan Akhir Anda</h2>
            <a href="#" className="flex items-center text-sm font-semibold text-abisOrange hover:underline">
              Lihat Semua Postingan <ChevronRight className="ml-1 h-4 w-4" />
            </a>
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
                    className={`h-full w-full object-cover transition duration-300 ${post.expired ? 'grayscale opacity-80' : 'group-hover:scale-105'}`}
                  />
                  <div className="absolute right-4 top-4 z-10">
                    <span
                      className={`rounded-full px-4 py-1.5 text-xs font-bold shadow-sm backdrop-blur-md ${
                        post.status === 'Layak Jual' ? 'bg-[#0e2718]/90 text-white' : 'bg-red-400/90 text-white'
                      }`}
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
                      <button className="text-slate-400 transition hover:text-abisGreen">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button className="text-red-400 transition hover:text-red-600">
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
      </div>
    </PenjualLayout>
  )
}
