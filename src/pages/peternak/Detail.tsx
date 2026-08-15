import React from 'react'
import PeternakLayout from '../../layouts/PeternakLayout'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Scale, Package, Navigation2, X } from 'lucide-react'

export default function PeternakDetail() {
  const { id } = useParams()
  
  // Dummy Data
  const detail = {
    id: id,
    store: 'Warteg Bahagia',
    type: 'Sisa Sayuran',
    weight: '5.0 kg',
    distance: '1.1 km',
    image: 'https://images.unsplash.com/photo-1595858682057-02488bc6ee05?w=600&h=400&fit=crop',
    mapImage: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&h=800&fit=crop',
    address: 'Jl. Merdeka No. 45, Jakarta Pusat'
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
            <h1 className="text-2xl font-literata font-bold text-abisGreen">{detail.store}</h1>
            <p className="text-sm text-slate-500">Postingan - {detail.type}</p>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT: INFO */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 overflow-hidden relative">
              <img src={detail.image} alt={detail.type} className="w-full h-64 object-cover rounded-xl" />
              <div className="absolute top-8 left-8 bg-abisGreen text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md">
                Tersedia
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-sm">
                <Package className="w-6 h-6 text-abisGreen mx-auto mb-2" />
                <p className="text-xs text-slate-500 mb-1">Kategori</p>
                <p className="font-bold text-sm text-slate-900 line-clamp-1">{detail.type}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-sm">
                <Scale className="w-6 h-6 text-abisGreen mx-auto mb-2" />
                <p className="text-xs text-slate-500 mb-1">Perkiraan Berat</p>
                <p className="font-bold text-sm text-slate-900">{detail.weight}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-sm">
                <MapPin className="w-6 h-6 text-abisGreen mx-auto mb-2" />
                <p className="text-xs text-slate-500 mb-1">Jarak</p>
                <p className="font-bold text-sm text-slate-900">{detail.distance}</p>
              </div>
            </div>
          </div>

          {/* RIGHT: MAP & ACTION */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col relative h-[500px]">
            {/* Map Placeholder */}
            <div className="absolute inset-0 z-0">
              <img src={detail.mapImage} alt="Map" className="w-full h-full object-cover opacity-80" />
            </div>
            
            {/* Map UI Overlay */}
            <div className="relative z-10 flex-1 flex flex-col justify-between p-6 bg-gradient-to-t from-white via-transparent to-white/50">
              
              <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg inline-flex items-center gap-3 self-start max-w-xs">
                <div className="bg-abisGreen p-2 rounded-full text-white">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">Lokasi Penjemputan</p>
                  <p className="text-sm font-bold text-slate-900 line-clamp-2">{detail.address}</p>
                </div>
              </div>

              <div className="space-y-4">
                <button className="bg-white text-slate-900 font-bold px-6 py-3 rounded-full shadow-lg flex items-center gap-2 hover:bg-slate-50 transition w-max ml-auto">
                  <Navigation2 className="w-5 h-5 text-blue-500" /> Buka di Maps
                </button>
                
                <div className="bg-white p-6 rounded-2xl shadow-xl flex gap-4">
                  <button className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-full hover:bg-red-50 hover:text-red-600 transition flex items-center justify-center gap-2">
                    <X className="w-5 h-5" /> Tolak
                  </button>
                  <Link to={`/peternak/konfirmasi/${detail.id}`} className="flex-1 bg-abisGreen text-white font-bold py-3.5 rounded-full hover:bg-[#0e2718] transition text-center shadow-md">
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
