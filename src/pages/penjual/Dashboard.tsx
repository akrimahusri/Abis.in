import React from 'react'
import PenjualLayout from '../../layouts/PenjualLayout'
import { Wallet, Clock, Edit2, Trash2, AlertTriangle, ChevronRight, Plus } from 'lucide-react'

// Dummy Data
const dummyPosts = [
  {
    id: 1,
    title: 'Tumis Kangkung',
    price: 6500,
    desc: 'Tumis kangkung yang masih segar, dimasak hari ini dan siap dinikmati.',
    image: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4859?w=500&h=400&fit=crop',
    status: 'Layak Jual',
    timeLeft: '2 jam',
  },
  {
    id: 2,
    title: 'Nasi Ayam Geprek',
    price: 15500,
    desc: 'Nasi ayam geprek dengan sambal pedas, baru dimasak hari ini dan masih layak konsumsi.',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&h=400&fit=crop',
    status: 'Layak Jual',
    timeLeft: '14 jam',
  },
  {
    id: 3,
    title: 'Nasi Kotak',
    price: 18000,
    desc: 'Nasi kotak lengkap dengan lauk dan sayur, masih fresh dan layak untuk dinikmati.',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500&h=400&fit=crop',
    status: 'Layak Jual',
    timeLeft: '6 jam',
  },
  {
    id: 4,
    title: 'Nasi Ikan Gegok',
    price: 15000,
    desc: 'Nasi ikan gegok dengan cita rasa khas dan bumbu rempah, masih segar dan siap disantap.',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&h=400&fit=crop',
    status: 'Tidak Layak',
    timeLeft: '0 jam',
    expired: true,
  },
]

export default function PenjualDashboard() {
  return (
    <PenjualLayout>
      <div className="space-y-8">
        
        {/* TOP SECTION: Hero Banner & Wallet Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* HERO BANNER */}
          <div className="lg:col-span-2 relative rounded-3xl overflow-hidden shadow-sm flex items-center min-h-[280px]">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&h=600&fit=crop" 
                alt="Banner" 
                className="w-full h-full object-cover object-center"
              />
              {/* Green gradient overlay to make text readable */}
              <div className="absolute inset-0 bg-gradient-to-r from-abisGreen/80 via-abisGreen/60 to-transparent"></div>
            </div>
            
            {/* Content */}
            <div className="relative z-10 p-10 max-w-lg text-white space-y-4">
              <h1 className="text-4xl md:text-5xl font-literata font-bold leading-tight">
                Punya surplus <br/>makanan hari ini?
              </h1>
              <p className="text-sm text-white/90">
                Kurangi limbah makanan sekaligus ciptakan nilai tambah bagi usaha Anda.
              </p>
              <div className="pt-2">
                <button className="bg-abisOrange text-white font-semibold px-6 py-2.5 rounded-full flex items-center gap-2 hover:bg-[#d67b22] transition shadow-md">
                  <Plus className="w-5 h-5" /> Postingan Baru
                </button>
              </div>
            </div>
          </div>

          {/* WALLET CARD */}
          <div className="bg-[#fcd393] rounded-3xl p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-literata font-bold text-slate-900">Dompet & Token</h2>
              <Wallet className="w-8 h-8 text-slate-900" />
            </div>
            
            <div className="mt-8 space-y-1">
              <p className="text-sm text-slate-700 font-medium">Pendapatan</p>
              <p className="text-3xl font-bold text-slate-900">Rp 6.000.000,00</p>
            </div>
            
            <div className="h-px bg-slate-900/10 my-6"></div>
            
            <div className="space-y-1">
              <p className="text-sm text-slate-700 font-medium">Jumlah Tokens</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-abisOrange flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm">T</div>
                <p className="text-3xl font-bold text-slate-900">4,365</p>
              </div>
            </div>
          </div>
        </div>


        {/* RECENT POSTS SECTION */}
        <div>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-literata font-bold text-abisGreen">Postingan Akhir Anda</h2>
            <a href="#" className="text-sm font-semibold text-abisOrange hover:underline flex items-center">
              Lihat Semua Postingan <ChevronRight className="w-4 h-4 ml-1" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dummyPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 flex flex-col relative group">
                
                {/* Image & Badge */}
                <div className="relative h-48">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className={`w-full h-full object-cover transition duration-300 ${post.expired ? 'grayscale opacity-80' : 'group-hover:scale-105'}`}
                  />
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm backdrop-blur-md ${
                      post.status === 'Layak Jual' ? 'bg-[#0e2718]/90 text-white' : 'bg-red-400/90 text-white'
                    }`}>
                      {post.status}
                    </span>
                  </div>
                  {/* Expired Overlay */}
                  {post.expired && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="font-bold text-slate-900 leading-tight">{post.title}</h3>
                    <p className={`font-bold text-sm ${post.expired ? 'text-slate-400' : 'text-abisOrange'}`}>
                      Rp {post.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4 flex-1">
                    {post.desc}
                  </p>
                  
                  {/* Divider */}
                  <div className="h-px bg-slate-100 mb-4 -mx-5 px-5"></div>
                  
                  {/* Footer (Time & Actions) */}
                  <div className="flex items-center justify-between mt-auto">
                    {post.expired ? (
                      <div className="flex items-center gap-1.5 text-red-500 text-xs font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Kadaluarsa
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-600 text-xs font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        Sisa {post.timeLeft}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <button className="text-slate-400 hover:text-abisGreen transition">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="text-red-400 hover:text-red-600 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </PenjualLayout>
  )
}
