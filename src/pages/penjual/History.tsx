import { ArrowDownLeft, ArrowUpRight, ChevronRight, Wallet } from 'lucide-react'
import PenjualLayout from '../../layouts/PenjualLayout'

const transactions = [
  { date: '24 Okt 2023, 14:20', item: 'Nasi Ayam Geprek', type: 'Penjualan', amount: '+ Rp 15.000', status: 'Selesai' },
  { date: '24 Okt 2023, 14:20', item: 'Nasi Ayam Geprek', type: 'Penjualan', amount: '+ Rp 15.000', status: 'Selesai' },
  { date: '24 Okt 2023, 14:20', item: 'Nasi Ayam Geprek', type: 'Penjualan', amount: '+ Rp 15.000', status: 'Selesai' },
  { date: '24 Okt 2023, 14:20', item: 'Nasi Ayam Geprek', type: 'Penjualan', amount: '+ Rp 15.000', status: 'Selesai' },
]

export default function PenjualHistory() {
  return (
    <PenjualLayout>
      <div className="mx-auto max-w-[1100px] py-6">
        <div className="mb-6">
          <h1 className="font-literata text-[2.2rem] font-bold leading-none text-[#1b4332]">Dompet & Saldo Penjual</h1>
          <p className="mt-2 text-[1rem] text-[#42564e]">Kelola pendapatan dan pencairan dana usaha surlus Anda.</p>
        </div>

        <div className="rounded-[1.5rem] border border-[#dfe3dc] bg-[#f8f7f2] p-4 shadow-[0_1px_0_rgba(29,54,42,0.04)] sm:p-5">
          <div className="rounded-[1.5rem] bg-[#123c2f] px-5 py-6 sm:px-8 sm:py-7">
            <p className="text-center text-[0.78rem] font-bold uppercase tracking-[0.12em] text-[#dfe6df]">Total Saldo Aktif</p>

            <div className="mt-5 flex items-center justify-center gap-2 text-center text-[#f6f6ee]">
              <span className="text-[0.9rem] font-medium">Rp.</span>
              <span className="font-literata text-[3rem] font-bold leading-none sm:text-[4rem]">1.250.000</span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-[0.9rem] border border-[#caf0e5] bg-[#dff4ee] px-4 py-3 text-[#1b4332] shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#cfeae0] text-[#1b4332]">
                    <ArrowDownLeft className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#1b4332]/70">Pendapatan Bulan Ini</p>
                    <p className="mt-1 text-[1.1rem] font-bold">Rp 2.356.000</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-[0.9rem] border border-[#caf0e5] bg-[#dff4ee] px-4 py-3 text-[#1b4332] shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#cfeae0] text-[#1b4332]">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#1b4332]/70">Total Dana Cair</p>
                    <p className="mt-1 text-[1.1rem] font-bold">Rp 1.000.000</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-[#dfe3dc] bg-[#f8f7f2] p-3 shadow-[0_1px_0_rgba(29,54,42,0.04)] sm:p-4">
          <h2 className="px-2 py-3 font-literata text-[2rem] font-bold leading-none text-[#1b4332]">Riwayat Transaksi</h2>

          <div className="overflow-hidden rounded-[1.2rem] border border-[#dfe3dc] bg-white">
            <div className="grid grid-cols-[1.1fr_1.8fr_1.1fr_1.1fr_0.9fr] gap-2 bg-[#dff4ee] px-4 py-3 text-center text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#1b4332]">
              <span className="text-left">Tanggal</span>
              <span className="text-left">Deskripsi</span>
              <span>Type</span>
              <span>Jumlah</span>
              <span>Status</span>
            </div>

            {transactions.map((item, index) => (
              <div key={index} className="grid grid-cols-[1.1fr_1.8fr_1.1fr_1.1fr_0.9fr] gap-2 items-center border-t border-[#e3e7e1] bg-white px-4 py-3 text-[0.9rem] text-[#1b4332]">
                <span className="text-left text-[#4a5a53]">{item.date}</span>

                <div className="flex items-center gap-3 text-left">
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md bg-[#dfe4dd]">
                    <img
                      src="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=120&h=120&fit=crop"
                      alt={item.item}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="font-medium">{item.item}</span>
                </div>

                <span className="text-center text-[#4a5a53]">{item.type}</span>
                <span className="text-center font-semibold text-[#1b4332]">{item.amount}</span>
                <span className="text-center text-[#1b4332]">{item.status}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            <button type="button" className="inline-flex items-center gap-2 rounded-full border border-[#dfe3dc] bg-white px-5 py-2.5 text-sm font-semibold text-[#1b4332] shadow-sm transition hover:border-[#1b4332]">
              Lihat Seluruh Riwayat
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </PenjualLayout>
  )
}
