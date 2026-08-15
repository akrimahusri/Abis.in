import React, { useState } from 'react'
import PeternakLayout from '../../layouts/PeternakLayout'
import { Link } from 'react-router-dom'
import { MapPin, Search, SlidersHorizontal, Filter } from 'lucide-react'

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
  },
  {
    id: 5,
    store: 'Pasar Induk Sayur',
    type: 'Sayur & Buah Afkir',
    weight: '25.0 kg',
    distance: '4.5 km',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&h=200&fit=crop'
  },
  {
    id: 6,
    store: 'Warung Nasi Uduk',
    type: 'Sisa Nasi',
    weight: '2.5 kg',
    distance: '1.8 km',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=200&h=200&fit=crop'
  },
]

export default function PeternakExplore() {
  const [search, setSearch] = useState('')

  return (
    <PeternakLayout>
      <div className="space-y-6">
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-3xl font-literata font-bold text-abisGreen">Jelajah Area</h1>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari lokasi atau toko..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-full py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-abisGreen"
              />
            </div>
            <button className="bg-white p-2.5 rounded-full border border-slate-200 text-slate-600 hover:text-abisGreen hover:border-abisGreen transition">
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MAP AREA (DUMMY) */}
        <div className="w-full h-72 lg:h-96 bg-slate-200 rounded-[2rem] overflow-hidden relative shadow-sm border border-slate-200">
          <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&h=600&fit=crop" alt="Map View" className="w-full h-full object-cover" />
          
          <div className="absolute top-6 right-6 flex flex-col gap-2">
            <button className="bg-white p-3 rounded-full shadow-lg text-slate-700 hover:text-abisGreen font-bold flex items-center justify-center">
              <Filter className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg font-bold text-sm text-abisGreen flex items-center gap-2 border border-green-100">
            <MapPin className="w-4 h-4" /> Menampilkan 12 titik terdekat
          </div>
        </div>

        {/* LISTINGS */}
        <div className="pt-4">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Tersedia di Sekitar Anda</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {dummyNearby.map((item) => (
              <Link to={`/peternak/detail/${item.id}`} key={item.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition group">
                <img src={item.image} alt={item.type} className="w-24 h-24 rounded-xl object-cover" />
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 leading-tight group-hover:text-abisGreen transition text-lg mb-1">{item.store}</h3>
                  <p className="text-sm text-slate-500 mb-3">{item.type}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-abisOrange bg-orange-50 px-3 py-1 rounded-full">{item.weight}</span>
                    <span className="flex items-center text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1 rounded-full"><MapPin className="w-3 h-3 mr-1 text-slate-400" /> {item.distance}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </PeternakLayout>
  )
}
