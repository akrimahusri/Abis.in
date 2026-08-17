import React, { useEffect, useState } from 'react'
import PeternakLayout from '../../layouts/PeternakLayout'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Scale, Package, Navigation2, X, Loader2, MessageSquare } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { resolveFoodImageUrl } from '../../lib/storage'

type DetailPosting = {
  id: string
  penjual_id: string
  nama_makanan: string
  jumlah: number
  foto_url: string | null
  status: string
  batas_waktu_ambil: string | null
  created_at: string
  storeName: string
  storeAddress: string
  storePhone?: string
}

export default function PeternakDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<DetailPosting | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPostingDetail = async () => {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const { data: posting, error: fetchErr } = await supabase
          .from('postingan_makanan')
          .select('id, penjual_id, nama_makanan, jumlah, foto_url, status, batas_waktu_ambil, created_at')
          .eq('id', id)
          .single()

        if (fetchErr || !posting) {
          setError('Detail postingan tidak ditemukan.')
          return
        }

        let storeName = 'Mitra Resto/Warteg'
        let storeAddress = 'Banda Aceh'
        let storePhone = ''

        if (posting.penjual_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nama_usaha, name, alamat, telepon')
            .eq('id', posting.penjual_id)
            .single()

          if (profile) {
            const profAny = profile as any
            storeName = profile.nama_usaha || profAny.name || storeName
            storeAddress = profile.alamat || storeAddress
            storePhone = profile.telepon || ''
          }
        }

        setDetail({
          id: posting.id,
          penjual_id: posting.penjual_id,
          nama_makanan: posting.nama_makanan,
          jumlah: posting.jumlah || 1,
          foto_url: posting.foto_url,
          status: posting.status,
          batas_waktu_ambil: posting.batas_waktu_ambil,
          created_at: posting.created_at,
          storeName,
          storeAddress,
          storePhone,
        })
      } catch (err) {
        console.warn('Error fetching detail:', err)
        setError('Gagal memuat detail postingan.')
      } finally {
        setLoading(false)
      }
    }

    fetchPostingDetail()
  }, [id])

  if (loading) {
    return (
      <PeternakLayout>
        <div className="max-w-5xl mx-auto py-20 text-center flex items-center justify-center gap-3 text-abisGreen font-bold">
          <Loader2 className="w-8 h-8 animate-spin" /> Memuat detail postingan...
        </div>
      </PeternakLayout>
    )
  }

  if (error || !detail) {
    return (
      <PeternakLayout>
        <div className="max-w-md mx-auto py-20 text-center space-y-4">
          <p className="text-lg font-bold text-slate-700">{error || 'Data tidak ditemukan.'}</p>
          <Link to="/peternak" className="inline-block bg-abisGreen text-white px-6 py-2.5 rounded-full font-bold">
            Kembali ke Dashboard
          </Link>
        </div>
      </PeternakLayout>
    )
  }

  const openGoogleMaps = () => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${detail.storeName}, ${detail.storeAddress}`
    )}`
    window.open(mapsUrl, '_blank')
  }

  const handleStartChatWithSeller = () => {
    if (!detail) return
    const sellerId = `chat-seller-${detail.penjual_id || Date.now()}`
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'

    try {
      const rawGlobal = localStorage.getItem('abis_global_chats')
      let globalList: any[] = rawGlobal ? JSON.parse(rawGlobal) : []
      const existingIdx = globalList.findIndex((g) => g.id === sellerId || g.sellerName === detail.storeName)

      if (existingIdx === -1) {
        globalList.unshift({
          id: sellerId,
          sellerName: detail.storeName,
          isPeternak: true,
          avatar: resolveFoodImageUrl(detail.foto_url, 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=120&h=120&fit=crop'),
          lastMessage: `Halo, menanyakan penjemputan pakan ${detail.nama_makanan}`,
          time: nowTime,
          unreadForSeller: true,
          unreadForPeternak: false,
          messages: [
            {
              sender: 'peternak',
              text: `Halo mitra penjual ${detail.storeName}, saya ingin mengonfirmasi jadwal penjemputan sisa pakan "${detail.nama_makanan}" (${detail.jumlah} kg). Apakah bisa dijemput hari ini?`,
              time: nowTime,
            },
          ],
        })
        localStorage.setItem('abis_global_chats', JSON.stringify(globalList))
      }
      window.dispatchEvent(new Event('abis_chat_updated'))
    } catch (e) {}
  }

  return (
    <PeternakLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center gap-4">
          <Link to="/peternak" className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-600 hover:text-abisGreen hover:bg-green-50 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-literata font-bold text-abisGreen">{detail.storeName}</h1>
            <p className="text-sm text-slate-500">Postingan - {detail.nama_makanan}</p>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT: INFO */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 overflow-hidden relative">
              <img
                src={resolveFoodImageUrl(detail.foto_url, 'https://images.unsplash.com/photo-1595858682057-02488bc6ee05?w=600&h=400&fit=crop')}
                alt={detail.nama_makanan}
                className="w-full h-64 object-cover rounded-xl"
              />
              <div className="absolute top-8 left-8 bg-abisGreen text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md capitalize">
                {detail.status === 'diambil_maggot' ? 'Sudah Diambil' : 'Tersedia'}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-sm">
                <Package className="w-6 h-6 text-abisGreen mx-auto mb-2" />
                <p className="text-xs text-slate-500 mb-1">Kategori</p>
                <p className="font-bold text-sm text-slate-900 line-clamp-1">Organik Maggot</p>
              </div>
              <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-sm">
                <Scale className="w-6 h-6 text-abisGreen mx-auto mb-2" />
                <p className="text-xs text-slate-500 mb-1">Perkiraan Berat</p>
                <p className="font-bold text-sm text-slate-900">{detail.jumlah} kg/Porsi</p>
              </div>
              <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-sm">
                <MapPin className="w-6 h-6 text-abisGreen mx-auto mb-2" />
                <p className="text-xs text-slate-500 mb-1">Lokasi</p>
                <p className="font-bold text-xs text-slate-900 line-clamp-1">{detail.storeAddress}</p>
              </div>
            </div>
          </div>

          {/* RIGHT: MAP & ACTION */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col relative h-[500px]">
            {/* Map Placeholder */}
            <div className="absolute inset-0 z-0">
              <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&h=800&fit=crop" alt="Map" className="w-full h-full object-cover opacity-80" />
            </div>
            
            {/* Map UI Overlay */}
            <div className="relative z-10 flex-1 flex flex-col justify-between p-6 bg-gradient-to-t from-white via-transparent to-white/50">
              
              <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg inline-flex items-center gap-3 self-start max-w-xs">
                <div className="bg-abisGreen p-2 rounded-full text-white shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">Lokasi Penjemputan</p>
                  <p className="text-sm font-bold text-slate-900 line-clamp-2">{detail.storeAddress}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={handleStartChatWithSeller}
                    className="bg-white text-abisGreen font-bold px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 hover:bg-emerald-50 transition border border-emerald-200 text-xs"
                  >
                    <MessageSquare className="w-4 h-4 text-abisGreen" /> Chat Penjual
                  </button>
                  <button
                    type="button"
                    onClick={openGoogleMaps}
                    className="bg-white text-slate-900 font-bold px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 hover:bg-slate-50 transition text-xs"
                  >
                    <Navigation2 className="w-4 h-4 text-blue-500" /> Buka di Maps
                  </button>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-xl flex gap-4">
                  <button
                    type="button"
                    onClick={() => navigate('/peternak')}
                    className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-full hover:bg-red-50 hover:text-red-600 transition flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" /> Batalkan
                  </button>
                  <Link to={`/peternak/konfirmasi/${detail.id}`} className="flex-1 bg-abisGreen text-white font-bold py-3.5 rounded-full hover:bg-[#0e2718] transition text-center shadow-md flex items-center justify-center">
                    Konfirmasi Pengambilan
                  </Link>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </PeternakLayout>
  )
}

