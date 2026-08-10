import { ChevronDown, Clock3, HelpCircle, Home, LogOut, MapPinned, ShoppingBag, UserRound } from 'lucide-react'

const sidebarItems = [
  { label: 'Beranda', icon: Home, active: true },
  { label: 'Keranjang', icon: ShoppingBag, active: false },
  { label: 'Riwayat', icon: Clock3, active: false },
  { label: 'Profil', icon: UserRound, active: false }
]

const filters = ['Jarak', 'Jenis Makanan', 'Harga', 'Waktu Ambil']

const foodItems = [
  {
    id: 1,
    title: 'Tumis Kangkung',
    location: 'Warung Berkah',
    price: 2500,
    amount: '5 Porsi',
    image:
      'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 2,
    title: 'Nasi Ayam Geprek',
    location: 'Warung Berkah',
    price: 10500,
    amount: '8 Porsi',
    image:
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 3,
    title: 'Nasi Bakar Ayam Suwir',
    location: 'Warung Berkah',
    price: 10000,
    amount: '3 Porsi',
    image:
      'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 4,
    title: 'Nasi Ayam Geprek',
    location: 'Warung Berkah',
    price: 10500,
    amount: '8 Porsi',
    image:
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80'
  }
]

export default function PembeliDashboard() {
  return (
    <div className="min-h-screen bg-[#123c2f] font-hanken">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full bg-[#123c2f] lg:w-[260px] lg:flex lg:flex-col lg:justify-between lg:py-8">
          <div>
            <div className="flex items-center justify-between px-5 py-4 lg:px-8 lg:py-0">
              <img src="/images/Logo sidebar.png" alt="Abis.in" className="h-12 w-auto object-contain lg:h-16" />
            </div>

            <nav className="flex flex-col gap-2 pb-4 pt-2 lg:pb-0 lg:pt-0">
              {sidebarItems.map(({ label, icon: Icon, active }) => (
                <button
                  key={label}
                  type="button"
                  className={`flex items-center gap-3 py-4 font-semibold transition-colors ${
                    active
                      ? 'ml-3 rounded-l-[2rem] bg-[#F8F9EB] pl-5 text-abisGreen lg:ml-6 lg:pl-6'
                      : 'ml-3 rounded-l-[2rem] pl-5 text-white hover:bg-white/5 lg:ml-6 lg:pl-6'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-4 px-5 pb-6 lg:px-8 lg:pb-0">
            <button type="button" className="flex items-center gap-3 py-2 text-left font-semibold text-white transition hover:text-abisOrange">
              <HelpCircle className="h-5 w-5" />
              Bantuan
            </button>
            <button type="button" className="flex items-center gap-3 py-2 text-left font-semibold text-white transition hover:text-red-400">
              <LogOut className="h-5 w-5" />
              Keluar
            </button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col bg-[#f5f3e8]">
          <header className="flex items-center justify-between px-5 py-6 md:px-8 lg:px-10">
            <div className="flex items-center gap-3">
              <h1 className="font-literata text-[40px] leading-none tracking-[-0.04em] text-[#123d32] md:text-[52px]">
                Jelajah Makanan
              </h1>
            </div>

            <div className="flex items-center gap-3 rounded-full bg-[#f1efe9] px-3 py-2 shadow-[inset_0_0_0_1px_rgba(18,61,50,0.08)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e7e1d9] text-xs font-bold text-[#123d32]">
                AB
              </div>
              <div className="text-right">
                <div className="text-[12px] font-semibold text-[#123d32]">Andi Budiman</div>
                <div className="text-[10px] text-[#123d32]/70">Eco-Warrior</div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-5 pb-8 md:px-8 lg:px-10">
            <div className="mb-6 flex flex-wrap gap-4">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className="flex items-center gap-3 rounded-full border border-[#1d4134]/25 bg-[#f7f4ee] px-5 py-3 text-[15px] text-[#234b3e] shadow-sm"
                >
                  <span>{filter}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_1fr]">
              <div className="space-y-4">
                {foodItems.map((item) => (
                  <article
                    key={item.id}
                    className="flex gap-4 rounded-[26px] border border-[#e9e3d8] bg-[#f8f4ee] p-3 shadow-[0_8px_18px_rgba(21,40,32,0.04)]"
                  >
                    <div className="relative min-w-[170px] overflow-hidden rounded-[20px]">
                      <span className="absolute left-2 top-2 z-10 rounded-full bg-[#0d3a2c]/90 px-2.5 py-1 text-[10px] font-bold text-white">
                        {item.amount}
                      </span>
                      <img src={item.image} alt={item.title} className="h-[150px] w-[170px] object-cover" />
                    </div>

                    <div className="flex flex-1 flex-col justify-between py-1">
                      <div>
                        <h2 className="text-[21px] font-bold leading-tight text-[#123d32]">{item.title}</h2>
                        <p className="mt-2 flex items-center gap-1 text-sm text-[#123d32]/70">
                          <MapPinned className="h-4 w-4" />
                          {item.location}
                        </p>
                      </div>

                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-[12px] text-[#123d32]/70">Rp {item.price.toLocaleString('id-ID')}</p>
                          <p className="text-[14px] font-semibold text-[#123d32]">Rp {item.price.toLocaleString('id-ID')}</p>
                        </div>

                        <button
                          type="button"
                          className="rounded-xl bg-[#ee8d16] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(238,141,22,0.25)] transition hover:bg-[#dc7d0a]"
                        >
                          Ambil
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="relative h-[560px] overflow-hidden rounded-[28px] border border-[#dfe5dd] bg-[#dfe7e4] shadow-[0_14px_30px_rgba(20,39,31,0.08)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.8),rgba(255,255,255,0)_36%),linear-gradient(135deg,#dfeae8,#d5e2dd_55%,#d0ddd8)]" />
                <div className="absolute inset-0 opacity-80" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.16) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'radial-gradient(circle at 20% 25%, rgba(58,99,70,0.35) 0, rgba(58,99,70,0.35) 5%, transparent 6%), radial-gradient(circle at 72% 58%, rgba(58,99,70,0.25) 0, rgba(58,99,70,0.25) 7%, transparent 8%), radial-gradient(circle at 40% 72%, rgba(58,99,70,0.28) 0, rgba(58,99,70,0.28) 8%, transparent 9%)' }} />

                <div className="absolute left-[15%] top-[22%] h-16 w-16 rounded-full border-[10px] border-[#e9f0ef] bg-[#5f8e73]/10" />
                <div className="absolute left-[55%] top-[35%] h-20 w-20 rounded-full border-[12px] border-[#edf3f0] bg-[#547b68]/10" />
                <div className="absolute left-[35%] top-[56%] h-24 w-24 rounded-full border-[12px] border-[#edf3f0] bg-[#5a7b68]/10" />

                <div className="absolute left-[18%] top-[12%] h-[185px] w-[2px] rotate-[16deg] bg-[#f8f4ef]/80" />
                <div className="absolute left-[27%] top-[42%] h-[240px] w-[2px] rotate-[-18deg] bg-[#f8f4ef]/80" />
                <div className="absolute left-[58%] top-[15%] h-[200px] w-[2px] rotate-[30deg] bg-[#f8f4ef]/80" />
                <div className="absolute left-[60%] top-[40%] h-[210px] w-[2px] rotate-[-12deg] bg-[#f8f4ef]/80" />
                <div className="absolute left-[38%] top-[10%] h-[2px] w-[180px] rotate-[16deg] bg-[#f8f4ef]/80" />
                <div className="absolute left-[20%] top-[48%] h-[2px] w-[220px] rotate-[-10deg] bg-[#f8f4ef]/80" />

                <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-lg font-bold text-[#0d3a2c] shadow-md">+</button>
                    <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-lg font-bold text-[#0d3a2c] shadow-md">−</button>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d74d3b] text-white shadow-lg ring-4 ring-white/80">
                    <MapPinned className="h-5 w-5" />
                  </div>
                </div>

                <div className="absolute left-[35%] top-[52%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#d64b3b] shadow-[0_0_0_6px_rgba(214,75,59,0.18)]">
                    <span className="h-2.5 w-2.5 rounded-full bg-white" />
                  </div>
                  <div className="mt-2 rounded-full border border-[#d1d9d4] bg-white/70 px-2 py-1 text-[10px] font-semibold text-[#133d32] backdrop-blur-sm">
                    Makananmu
                  </div>
                </div>

                <div className="absolute bottom-6 right-6 rounded-full bg-white/80 px-3 py-2 text-[10px] font-semibold text-[#123d32] shadow-md backdrop-blur-sm">
                  Peta Lokasi
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
