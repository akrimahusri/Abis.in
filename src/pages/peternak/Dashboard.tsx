import React from 'react'
import PeternakLayout from '../../layouts/PeternakLayout'
import { Link } from 'react-router-dom'
import { Target, Search, Package, MapPin, ChevronRight, Gift } from 'lucide-react'

const dummyNearby = [
  {
    id: 1,
    store: 'Warteg Bahagia',
    type: 'Sisa Sayuran',
    weight: '5.0 kg',
    distance: '1.1 km',
    image: 'https://images.unsplash.com/photo-1595858682057-02488bc6ee05?w=200&h=200&fit=crop'
  },
  {
    id: 2,
    store: 'Ayam Bakar Taliwang',
    type: 'Sisa Nasi & Tulang',
    weight: '3.2 kg',
    distance: '2.4 km',
    image: 'https://images.unsplash.com/photo-1584269600519-112d06637ded?w=200&h=200&fit=crop'
  },
  {
    id: 3,
    store: 'Toko Roti Sedap',
    type: 'Roti Kadaluarsa',
    weight: '8.0 kg',
    distance: '3.0 km',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop'
  }
]

export default function PeternakDashboard() {
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
              <p className="text-slate-500 mb-6">Kumpulkan 10 kg sisa makanan organik per hari untuk mendapakat bonus poin tambahan.</p>
              
              <div className="space-y-2 mb-8">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-abisGreen">7.5 kg Terkumpul</span>
                  <span className="text-slate-400">Target: 10 kg</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                  <div className="bg-abisGreen h-4 rounded-full w-[75%] transition-all duration-1000"></div>
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
              <p className="text-4xl font-bold text-slate-900 relative z-10">124 <span className="text-xl">kg</span></p>
            </div>
            
            <div className="bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col justify-center items-center text-center shadow-sm relative overflow-hidden">
              <p className="text-sm text-slate-500 font-medium mb-1 relative z-10">Sisa Kapasitas Kendaraan</p>
              <p className="text-4xl font-bold text-abisGreen relative z-10">22.5 <span className="text-xl">kg</span></p>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dummyNearby.map((item) => (
              <Link to={`/peternak/detail/${item.id}`} key={item.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition group">
                <img src={item.image} alt={item.type} className="w-20 h-20 rounded-xl object-cover" />
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 leading-tight group-hover:text-abisGreen transition">{item.store}</h3>
                  <p className="text-xs text-slate-500 mb-2">{item.type}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-abisOrange">{item.weight}</span>
                    <span className="flex items-center text-xs text-slate-400 font-medium"><MapPin className="w-3 h-3 mr-1" /> {item.distance}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* FLOATING ALERT POIN */}
        <div className="bg-abisGreen text-white rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Tukarkan Poinmu!</h3>
              <p className="text-white/80 text-sm">Anda telah mencapai 518 Poin. Tukarkan dengan diskon pakan atau hadiah lainnya.</p>
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
