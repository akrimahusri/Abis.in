import React, { useState } from 'react'
import PeternakLayout from '../../layouts/PeternakLayout'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Truck, Scale, Check } from 'lucide-react'

export default function PeternakKonfirmasi() {
  const { id } = useParams()
  const [weight, setWeight] = useState<string>('')
  
  // Dummy Data
  const pricePerKg = 0 // Some places give it for free
  const totalHarga = weight ? parseFloat(weight) * pricePerKg : 0

  return (
    <PeternakLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <Link to={`/peternak/detail/${id}`} className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-600 hover:text-abisGreen hover:bg-green-50 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
            <img src="https://images.unsplash.com/photo-1583394838336-acd977736f90?w=100&h=100&fit=crop" alt="Profile" className="w-full h-full object-cover rounded-full p-1" />
          </div>
        </div>

        <div className="text-center space-y-4 max-w-lg mx-auto">
          <h1 className="text-3xl font-literata font-bold text-abisGreen">Konfirmasi Serah Terima</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Pastikan berat makanan yang ditimbang sesuai dengan yang Anda input dan diverifikasi oleh Penjual atau Pihak Warung sebelum mengkonfirmasi.
          </p>
        </div>

        {/* INPUT CARD */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-6">
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Berat Aktual (Timbangan)</label>
            <div className="relative">
              <input 
                type="number" 
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-6 pl-8 pr-16 text-4xl font-bold text-abisGreen focus:outline-none focus:border-abisGreen focus:bg-white transition-colors"
                autoFocus
              />
              <span className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">kg</span>
            </div>
          </div>

          <div className="h-px bg-slate-100 my-6"></div>

          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-600">Total Biaya (Jika Ada)</p>
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-1">Rp {pricePerKg}/kg</p>
              <p className="text-2xl font-bold text-abisOrange">Rp {totalHarga.toLocaleString('id-ID')}</p>
            </div>
          </div>

          <button className="w-full bg-abisGreen text-white font-bold py-4 rounded-full text-lg hover:bg-[#0e2718] transition flex items-center justify-center gap-2 mt-8 shadow-md">
            <CheckCircle2 className="w-6 h-6" /> Konfirmasi & Selesaikan Tugas
          </button>
        </div>

        {/* STEPPER */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="bg-green-50 rounded-xl p-4 border border-green-100 relative">
            <div className="w-6 h-6 rounded-full bg-abisGreen text-white flex items-center justify-center text-xs font-bold mb-2">
              <Check className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-abisGreen">Langkah 1</p>
            <p className="text-xs text-slate-600 font-medium">Penjemputan Lokasi</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100 relative">
            <div className="w-6 h-6 rounded-full bg-abisGreen text-white flex items-center justify-center text-xs font-bold mb-2">
              <Check className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-abisGreen">Langkah 2</p>
            <p className="text-xs text-slate-600 font-medium">Timbang Makanan</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 relative shadow-sm opacity-60">
            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold mb-2">
              3
            </div>
            <p className="text-xs font-bold text-slate-400">Langkah 3</p>
            <p className="text-xs text-slate-400 font-medium">Konfirmasi Berat</p>
          </div>
        </div>

      </div>
    </PeternakLayout>
  )
}
