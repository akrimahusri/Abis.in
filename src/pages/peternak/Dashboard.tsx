import React, { useEffect, useState } from 'react'
import PeternakLayout from '../../layouts/PeternakLayout'
import { Link } from 'react-router-dom'
import { Target, Search, Package, MapPin, ChevronRight, Gift, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { resolveFoodImageUrl } from '../../lib/storage'

type NearbyPosting = {
  id: string
  penjual_id: string
  nama_makanan: string
  jumlah: number
  foto_url: string | null
  status: string
  created_at: string
  storeName: string
  storeAddress: string
}

export default function PeternakDashboard() {
  const [loading, setLoading] = useState(true)
  const [nearbyPostings, setNearbyPostings] = useState<NearbyPosting[]>([])
  const [totalKgCollected, setTotalKgCollected] = useState<number>(0)
  const [todayKgCollected, setTodayKgCollected] = useState<number>(0)
  const [totalPoints, setTotalPoints] = useState<number>(0)

  const dailyTargetKg = 10
  const vehicleMaxCapacityKg = 30

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        const peternakId = session?.user?.id

        // 1. Fetch postings with status = 'tidak_layak_konsumsi'
        const { data: postings, error: postingError } = await supabase
          .from('postingan_makanan')
          .select('id, penjual_id, nama_makanan, jumlah, foto_url, status, created_at')
          .eq('status', 'tidak_layak_konsumsi')
          .order('created_at', { ascending: false })

        if (!postingError && postings) {
          const sellerIds = [...new Set(postings.map((p) => p.penjual_id))]
          let sellerMap = new Map<string, { nama_usaha: string; alamat: string }>()

          if (sellerIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, nama_usaha, alamat')
              .in('id', sellerIds)

            if (profiles) {
              profiles.forEach((prof: any) => {
                sellerMap.set(prof.id, {
                  nama_usaha: prof.nama_usaha || prof.name || 'Penjual Organik',
                  alamat: prof.alamat || 'Banda Aceh',
                })
              })
            }
          }

          const formatted = postings.map((p) => {
            const sellerInfo = sellerMap.get(p.penjual_id) || {
              nama_usaha: 'Mitra Resto/Warteg',
              alamat: 'Banda Aceh',
            }
            return {
              id: p.id,
              penjual_id: p.penjual_id,
              nama_makanan: p.nama_makanan,
              jumlah: p.jumlah || 1,
              foto_url: p.foto_url,
              status: p.status,
              created_at: p.created_at,
              storeName: sellerInfo.nama_usaha,
              storeAddress: sellerInfo.alamat,
            }
          })
          setNearbyPostings(formatted)
        }

        // 2. Fetch completed pasokan_maggot for logged-in peternak
        if (peternakId) {
          const { data: pasokanList } = await supabase
            .from('pasokan_maggot')
            .select('berat_aktual, berat_estimasi, created_at, status')
            .eq('peternak_id', peternakId)
            .eq('status', 'selesai')

          if (pasokanList && pasokanList.length > 0) {
            let total = 0
            let todayTotal = 0
            const todayStr = new Date().toISOString().split('T')[0]

            pasokanList.forEach((item) => {
              const weight = Number(item.berat_aktual || item.berat_estimasi || 0)
              total += weight

              if (item.created_at && item.created_at.startsWith(todayStr)) {
                todayTotal += weight
              }
            })

            setTotalKgCollected(Math.round(total * 10) / 10)
            setTodayKgCollected(Math.round(todayTotal * 10) / 10)
            setTotalPoints(Math.floor(total * 10)) // 1 kg = 10 Poin
          }
        }
      } catch (err) {
        console.warn('Error fetching peternak dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const progressPct = Math.min(100, Math.round((todayKgCollected / dailyTargetKg) * 100))
  const sisaKapasitas = Math.max(0, Math.round((vehicleMaxCapacityKg - todayKgCollected) * 10) / 10)

  return (
    <PeternakLayout>
      <div className="space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* TARGET HARIAN */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-100 p-2 rounded-full text-abisGreen">
                  <Target className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-literata font-bold text-slate-900">Target Harian</h2>
              </div>
              <p className="text-slate-500 mb-6">Kumpulkan {dailyTargetKg} kg sisa makanan organik per hari untuk mendapatkan bonus poin tambahan.</p>
              
              <div className="space-y-2 mb-8">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-abisGreen">{todayKgCollected} kg Terkumpul Hari Ini</span>
                  <span className="text-slate-400">Target: {dailyTargetKg} kg</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-abisGreen h-4 rounded-full transition-all duration-1000"
                    style={{ width: `${progressPct}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <Link to="/peternak/explore" className="bg-abisGreen text-white font-semibold py-3 px-6 rounded-full inline-flex items-center justify-center gap-2 hover:bg-[#0e2718] transition w-full sm:w-auto">
              <Search className="w-5 h-5" /> Cari Sisa Makanan Terdekat
            </Link>
          </div>

          {/* STATS KANAN */}
          <div className="space-y-6">
            <div className="bg-[#fcd393] rounded-[2rem] p-6 flex flex-col justify-center items-center text-center shadow-sm relative overflow-hidden">
              <Package className="w-8 h-8 text-slate-900 mb-2 opacity-50 absolute top-4 right-4" />
              <p className="text-sm text-slate-800 font-medium mb-1 relative z-10">Total Sisa Makanan Terkumpul</p>
              <p className="text-4xl font-bold text-slate-900 relative z-10">{totalKgCollected} <span className="text-xl">kg</span></p>
            </div>
            
            <div className="bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col justify-center items-center text-center shadow-sm relative overflow-hidden">
              <p className="text-sm text-slate-500 font-medium mb-1 relative z-10">Sisa Kapasitas Kendaraan</p>
              <p className="text-4xl font-bold text-abisGreen relative z-10">{sisaKapasitas} <span className="text-xl">kg</span></p>
            </div>
          </div>
          
        </div>

        {/* LIST TERDEKAT */}
        <div>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-literata font-bold text-abisGreen">Potensi Pengambilan Terdekat</h2>
            <Link to="/peternak/explore" className="text-sm font-semibold text-abisOrange hover:underline flex items-center">
              Lihat Peta <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="bg-white rounded-[1.5rem] p-12 text-center border border-slate-100 flex items-center justify-center gap-3 text-abisGreen font-bold">
              <Loader2 className="w-6 h-6 animate-spin" /> Memuat data sampah organik dari database...
            </div>
          ) : nearbyPostings.length === 0 ? (
            <div className="bg-white rounded-[1.5rem] p-12 text-center border border-slate-100 text-slate-500">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700">Belum ada potensi pakan organik yang tersedia saat ini.</p>
              <p className="text-xs text-slate-400 mt-1">Postingan sampah organik baru dari mitra penjual akan muncul di sini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {nearbyPostings.map((item) => (
                <Link to={`/peternak/detail/${item.id}`} key={item.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition group">
                  <img
                    src={resolveFoodImageUrl(item.foto_url, 'https://images.unsplash.com/photo-1595858682057-02488bc6ee05?w=200&h=200&fit=crop')}
                    alt={item.nama_makanan}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 leading-tight group-hover:text-abisGreen transition truncate">{item.storeName}</h3>
                    <p className="text-xs text-slate-500 mb-2 truncate">{item.nama_makanan}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-abisOrange">{item.jumlah} Porsi/Kg</span>
                      <span className="flex items-center text-xs text-slate-400 font-medium truncate max-w-[100px]"><MapPin className="w-3 h-3 mr-1 shrink-0" /> {item.storeAddress}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* FLOATING ALERT POIN */}
        <div className="bg-abisGreen text-white rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Tukarkan Poinmu!</h3>
              <p className="text-white/80 text-sm">Anda telah mencapai {totalPoints} Poin. Tukarkan dengan diskon pakan atau hadiah lainnya.</p>
            </div>
          </div>
          <button className="bg-white text-abisGreen font-bold px-6 py-2 rounded-full hover:bg-slate-100 transition hidden sm:block">
            Tukar Sekarang
          </button>
        </div>

      </div>
    </PeternakLayout>
  )
}

