import React, { useEffect, useState } from 'react'
import PeternakLayout from '../../layouts/PeternakLayout'
import { Link } from 'react-router-dom'
import { Clock, CheckCircle2, ChevronRight, MapPin, Loader2, Package } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { resolveFoodImageUrl, DEFAULT_FOOD_IMAGE } from '../../lib/storage'

type RiwayatItem = {
  id: string
  postingan_id: string
  time: string
  status: 'Belum Selesai' | 'Selesai'
  store: string
  desc: string
  weight: string
  weightNum: number
  foto_url: string | null
}

export default function PeternakRiwayat() {
  const [activeTab, setActiveTab] = useState<'Belum Selesai' | 'Selesai'>('Selesai')
  const [loading, setLoading] = useState(true)
  const [riwayatList, setRiwayatList] = useState<RiwayatItem[]>([])
  const [totalKgCollected, setTotalKgCollected] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)

  useEffect(() => {
    const fetchRiwayatData = async () => {
      setLoading(true)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          setLoading(false)
          return
        }

        const peternakId = session.user.id

        // Fetch pasokan_maggot for this peternak
        const { data: pasokanData, error: pasokanErr } = await supabase
          .from('pasokan_maggot')
          .select('id, postingan_id, berat_aktual, berat_estimasi, status, created_at')
          .eq('peternak_id', peternakId)
          .order('created_at', { ascending: false })

        if (!pasokanErr && pasokanData && pasokanData.length > 0) {
          const postingIds = [...new Set(pasokanData.map((p) => p.postingan_id))]

          const { data: postings } = await supabase
            .from('postingan_makanan')
            .select('id, penjual_id, nama_makanan, foto_url')
            .in('id', postingIds)

          const postingMap = new Map<string, { penjual_id: string; nama_makanan: string; foto_url: string | null }>()
          if (postings) {
            postings.forEach((p) => postingMap.set(p.id, p))
          }

          const sellerIds = [...new Set(postings?.map((p) => p.penjual_id) || [])]
          const sellerMap = new Map<string, string>()

          if (sellerIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, nama_usaha')
              .in('id', sellerIds)

            if (profiles) {
              profiles.forEach((prof: any) => {
                sellerMap.set(prof.id, prof.nama_usaha || prof.name || 'Mitra Penjual')
              })
            }
          }

          let sumKg = 0
          const items: RiwayatItem[] = pasokanData.map((item) => {
            const post = postingMap.get(item.postingan_id)
            const storeName = post ? sellerMap.get(post.penjual_id) || 'Mitra Penjual' : 'Mitra Penjual'
            const foodName = post?.nama_makanan || 'Sisa Makanan Organik'

            const weightVal = Number(item.berat_aktual || item.berat_estimasi || 0)
            if (item.status === 'selesai') {
              sumKg += weightVal
            }

            const formattedTime = item.created_at
              ? new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
              : '00:00'

            return {
              id: item.id,
              postingan_id: item.postingan_id,
              time: formattedTime,
              status: item.status === 'selesai' ? 'Selesai' : 'Belum Selesai',
              store: storeName,
              desc: foodName,
              weight: `${weightVal} kg`,
              weightNum: weightVal,
              foto_url: post?.foto_url || null,
            }
          })

          setRiwayatList(items)
          setTotalKgCollected(Math.round(sumKg * 10) / 10)
          setTotalPoints(Math.floor(sumKg * 10))
        }
      } catch (err) {
        console.warn('Error fetching riwayat:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRiwayatData()
  }, [])

  const filteredRiwayat = riwayatList.filter((item) => item.status === activeTab)

  return (
    <PeternakLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-literata font-bold text-abisGreen">Riwayat Pengambilan</h1>
        </div>

        {/* STATS KANAN & KIRI DIGABUNG JADI BARIS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 flex justify-between items-center shadow-sm">
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">Total sisa makanan diambil</p>
              <p className="text-3xl font-bold text-abisGreen">{totalKgCollected} <span className="text-lg">kg</span></p>
            </div>
            <div className="bg-green-50 p-3 rounded-full text-abisGreen">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          </div>
          
          <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 flex justify-between items-center shadow-sm">
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">Total Poin</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-abisOrange">{totalPoints}</p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-abisOrange flex items-center justify-center text-white font-bold border-4 border-orange-100 shadow-sm text-xl">
              T
            </div>
          </div>
        </div>

        {/* TABS & LIST */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
          
          <div className="flex border-b border-slate-200 mb-6">
            <button 
              onClick={() => setActiveTab('Belum Selesai')}
              className={`pb-4 px-6 font-bold text-sm transition-colors border-b-2 ${activeTab === 'Belum Selesai' ? 'border-abisGreen text-abisGreen' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Belum Selesai
            </button>
            <button 
              onClick={() => setActiveTab('Selesai')}
              className={`pb-4 px-6 font-bold text-sm transition-colors border-b-2 ${activeTab === 'Selesai' ? 'border-abisGreen text-abisGreen' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Selesai
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center flex items-center justify-center gap-3 text-abisGreen font-bold">
              <Loader2 className="w-6 h-6 animate-spin" /> Memuat riwayat pengambilan...
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRiwayat.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Package className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-slate-500 font-bold">Belum ada riwayat di kategori {activeTab}.</p>
                </div>
              ) : (
                filteredRiwayat.map((item) => (
                  <div key={item.id} className="flex flex-col md:flex-row items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100 group gap-4">
                    
                    {/* Waktu & Detail */}
                    <div className="flex items-center gap-4 flex-1 w-full">
                      <div className="text-lg font-bold text-slate-900 w-16 text-center">{item.time}</div>
                      <img 
                        src={resolveFoodImageUrl(item.foto_url, 'https://images.unsplash.com/photo-1595858682057-02488bc6ee05?w=200&h=200&fit=crop')} 
                        alt={item.desc}
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = DEFAULT_FOOD_IMAGE
                        }}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                      <div>
                        <p className={`text-xs font-bold mb-1 ${item.status === 'Selesai' ? 'text-abisGreen' : 'text-amber-500'}`}>{item.status}</p>
                        <h4 className="font-bold text-slate-900 leading-tight">{item.store}</h4>
                        <p className="text-sm text-slate-500 flex items-center mt-1"><MapPin className="w-3 h-3 mr-1" /> {item.desc}</p>
                      </div>
                    </div>

                    {/* Berat & Action */}
                    <div className="flex items-center justify-between w-full md:w-auto gap-6 md:gap-8">
                      <div className="text-right">
                        <p className="text-xl font-bold text-slate-900">{item.weight}</p>
                      </div>
                      {item.status === 'Belum Selesai' ? (
                        <Link to={`/peternak/konfirmasi/${item.postingan_id}`} className="bg-abisGreen text-white font-bold text-sm px-6 py-2.5 rounded-full hover:bg-[#0e2718] transition flex items-center gap-2 whitespace-nowrap">
                          <CheckCircle2 className="w-4 h-4" /> Konfirmasi
                        </Link>
                      ) : (
                        <div className="text-slate-400 flex items-center gap-1 font-bold text-sm px-6 py-2.5 bg-slate-100 rounded-full cursor-not-allowed">
                          Selesai
                        </div>
                      )}
                    </div>

                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>
    </PeternakLayout>
  )
}

