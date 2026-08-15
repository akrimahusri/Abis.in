import React, { useState } from 'react'
import PeternakLayout from '../../layouts/PeternakLayout'
import { Link } from 'react-router-dom'
import { Clock, CheckCircle2, ChevronRight, MapPin } from 'lucide-react'

const dummyRiwayat = [
  {
    id: 1,
    time: '09:28',
    status: 'Belum Selesai',
    store: 'Warteg Bahagia',
    desc: 'Sisa Sayuran & Nasi',
    weight: '15.5 kg',
  },
  {
    id: 2,
    time: '12:15',
    status: 'Belum Selesai',
    store: 'Ayam Bakar Taliwang',
    desc: 'Sisa Tulang & Nasi',
    weight: '42.0 kg',
  },
  {
    id: 3,
    time: '14:30',
    status: 'Selesai',
    store: 'Toko Roti Sedap',
    desc: 'Roti Kadaluarsa',
    weight: '22.8 kg',
  },
  {
    id: 4,
    time: '16:00',
    status: 'Selesai',
    store: 'Pasar Induk',
    desc: 'Sisa Sayur & Buah',
    weight: '43.7 kg',
  },
]

export default function PeternakRiwayat() {
  const [activeTab, setActiveTab] = useState<'Belum Selesai' | 'Selesai'>('Belum Selesai')
  
  const filteredRiwayat = dummyRiwayat.filter(item => item.status === activeTab)

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
              <p className="text-3xl font-bold text-abisGreen">124 <span className="text-lg">kg</span></p>
            </div>
            <div className="bg-green-50 p-3 rounded-full text-abisGreen">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          </div>
          
          <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 flex justify-between items-center shadow-sm">
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">Total Poin</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-abisOrange">518</p>
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

          <div className="space-y-4">
            {filteredRiwayat.length === 0 ? (
              <p className="text-center text-slate-500 py-10">Belum ada riwayat di kategori ini.</p>
            ) : (
              filteredRiwayat.map((item) => (
                <div key={item.id} className="flex flex-col md:flex-row items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100 group gap-4">
                  
                  {/* Waktu & Detail */}
                  <div className="flex items-center gap-6 flex-1 w-full">
                    <div className="text-lg font-bold text-slate-900 w-16">{item.time}</div>
                    <div>
                      <p className={`text-xs font-bold mb-1 ${item.status === 'Selesai' ? 'text-abisGreen' : 'text-red-500'}`}>{item.status}</p>
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
                      <Link to={`/peternak/konfirmasi/${item.id}`} className="bg-abisGreen text-white font-bold text-sm px-6 py-2.5 rounded-full hover:bg-[#0e2718] transition flex items-center gap-2 whitespace-nowrap">
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

        </div>

      </div>
    </PeternakLayout>
  )
}
