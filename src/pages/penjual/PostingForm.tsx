import { useState } from 'react'
import { CalendarDays, Camera, MapPin, Tag, Trash2, UtensilsCrossed } from 'lucide-react'
import PenjualLayout from '../../layouts/PenjualLayout'

type StatusKondisi = 'layak' | 'organik'

export default function PenjualPostingForm() {
  const [selectedStatus, setSelectedStatus] = useState<StatusKondisi>('layak')
  const [form, setForm] = useState({
    namaMakanan: '',
    kadaluarsa: '',
    jumlahPorsi: '',
    deskripsi: '',
    hargaAsli: '',
    hargaJual: '',
    lokasi: 'Warteg Bahagia - Banda Aceh',
  })

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const isLayak = selectedStatus === 'layak'

  return (
    <PenjualLayout>
      <div className="mx-auto max-w-[1180px] py-6">
        <div className="mb-6">
          <h1 className="font-literata text-[2.2rem] font-bold leading-none text-[#1b4332]">Buat Postingan Baru</h1>
          <p className="mt-2 max-w-xl text-[0.96rem] text-[#42564e]">
            Detailkan sisa makanan Anda untuk mengurangi limbah dan menghasilkan dampak
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <section className="rounded-[1.7rem] border border-[#dfe3dc] bg-[#f8f7f2] p-5 shadow-[0_1px_0_rgba(29,54,42,0.04)]">
              <div className="mb-4 flex items-center gap-3 text-[1.1rem] font-bold text-[#1b4332]">
                <span className="text-[1.1rem] font-bold">Media Makanan</span>
              </div>

              <div className="flex min-h-[250px] cursor-pointer items-center justify-center rounded-[1.1rem] border-2 border-dashed border-[#b8bcb6] bg-[#eef0ec] px-4 text-center transition hover:border-[#1b4332]">
                <div className="space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#dbe6d9] text-[#1b4332]">
                    <Camera className="h-7 w-7" />
                  </div>
                  <p className="text-sm text-[#516159]">Tarik dan lepas atau klik untuk unggah</p>
                  <p className="text-[0.72rem] text-[#7a867d]">PNG, JPG, WEBP</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#1b4332]">Nama Makanan</span>
                  <input
                    value={form.namaMakanan}
                    onChange={(event) => updateField('namaMakanan', event.target.value)}
                    placeholder="Contoh: Tumis Kangkung"
                    className="w-full rounded-xl border border-[#a6aea5] bg-white px-3 py-3 text-[0.96rem] text-[#1b4332] outline-none placeholder:text-[#7b8a81]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#1b4332]">Estimasi Kadaluwarsa</span>
                  <div className="relative">
                    <input
                      type="date"
                      value={form.kadaluarsa}
                      onChange={(event) => updateField('kadaluarsa', event.target.value)}
                      className="w-full rounded-xl border border-[#a6aea5] bg-white px-3 py-3 pr-11 text-[0.96rem] text-[#1b4332] outline-none"
                    />
                    <CalendarDays className="pointer-events-auto absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1b4332]" />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#1b4332]">Jumlah Porsi</span>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={form.jumlahPorsi}
                      onChange={(event) => updateField('jumlahPorsi', event.target.value)}
                      placeholder="Masukkan jumlah porsi"
                      className="w-full rounded-xl border border-[#a6aea5] bg-white px-3 py-3 pr-20 text-[0.96rem] text-[#1b4332] outline-none placeholder:text-[#7b8a81]"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#1b4332]">Porsi</span>
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#1b4332]">Deskripsi (Opsional)</span>
                  <textarea
                    value={form.deskripsi}
                    onChange={(event) => updateField('deskripsi', event.target.value)}
                    placeholder="Ceritakan detail makanan Anda disini..."
                    className="h-24 w-full resize-none rounded-xl border border-[#a6aea5] bg-white px-3 py-3 text-[0.96rem] text-[#1b4332] outline-none placeholder:text-[#7b8a81]"
                  />
                </label>
              </div>
            </section>
          </div>

          <div className="space-y-5">
            <section className="rounded-[1.7rem] border border-[#dfe3dc] bg-[#f8f7f2] p-5 shadow-[0_1px_0_rgba(29,54,42,0.04)]">
              <div className="mb-5 flex items-center gap-3 text-[1.1rem] font-bold text-[#1b4332]">
                <span className="text-[1.1rem] font-bold">Status Kondisi</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSelectedStatus('layak')}
                  className={`flex min-h-[120px] flex-col items-center justify-center rounded-[1.15rem] border p-4 text-center transition ${
                    isLayak
                      ? 'border-[#1b4332] bg-[#dfeae2] shadow-sm ring-2 ring-[#1b4332]/10'
                      : 'border-[#dfe3dc] bg-[#f2f3f0] hover:border-[#1b4332]'
                  }`}
                >
                  <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${isLayak ? 'bg-[#1b4332] text-white' : 'bg-[#dfe3dc] text-[#1b4332]'}`}>
                    <UtensilsCrossed className="h-6 w-6" />
                  </div>
                  <span className="text-[1rem] font-medium text-[#1b4332]">Layak Konsumsi</span>
                  <span className="mt-2 text-[0.8rem] leading-relaxed text-[#4f5f57]">Siap makan, bisa berkulitas tinggi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus('organik')}
                  className={`flex min-h-[120px] flex-col items-center justify-center rounded-[1.15rem] border p-4 text-center transition ${
                    !isLayak
                      ? 'border-[#1b4332] bg-[#dfeae2] shadow-sm ring-2 ring-[#1b4332]/10'
                      : 'border-[#dfe3dc] bg-[#f2f3f0] hover:border-[#1b4332]'
                  }`}
                >
                  <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${!isLayak ? 'bg-[#1b4332] text-white' : 'bg-[#dfe3dc] text-[#1b4332]'}`}>
                    <Trash2 className="h-6 w-6" />
                  </div>
                  <span className="text-[1rem] font-medium text-[#1b4332]">Sampah Organik</span>
                  <span className="mt-2 text-[0.8rem] leading-relaxed text-[#4f5f57]">Untuk pengomposan atau ecoenzyme</span>
                </button>
              </div>
            </section>

            <section className="rounded-[1.7rem] border border-[#dfe3dc] bg-[#f8f7f2] p-5 shadow-[0_1px_0_rgba(29,54,42,0.04)]">
              <div className="mb-5 flex items-center gap-3 text-[1.1rem] font-bold text-[#1b4332]">
                <span className="text-[1.1rem] font-bold">Pengaturan Harga</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#1b4332]">Harga Asli (Rp)</span>
                  <input
                    type="number"
                    value={form.hargaAsli}
                    onChange={(event) => updateField('hargaAsli', event.target.value)}
                    placeholder="13000"
                    className="w-full rounded-xl border border-[#a6aea5] bg-white px-3 py-3 text-[0.96rem] text-[#1b4332] outline-none placeholder:text-[#7b8a81]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#1b4332]">Harga Jual (Rp)</span>
                  <input
                    type="number"
                    value={form.hargaJual}
                    onChange={(event) => updateField('hargaJual', event.target.value)}
                    placeholder="6500"
                    className="w-full rounded-xl border border-[#a6aea5] bg-white px-3 py-3 text-[0.96rem] text-[#1b4332] outline-none placeholder:text-[#7b8a81]"
                  />
                </label>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl border border-[#f0d3a8] bg-[#fef6eb] px-3 py-2 text-[#9d5d19]">
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <Tag className="h-4 w-4" />
                  DISKON 50%
                </span>
                <span className="text-[0.7rem] text-[#9d5d19]">Hemat dan ramah lingkungan</span>
              </div>
            </section>

            <section className="rounded-[1.7rem] border border-[#dfe3dc] bg-[#f8f7f2] p-5 shadow-[0_1px_0_rgba(29,54,42,0.04)]">
              <div className="mb-4 flex items-center gap-3 text-[1.1rem] font-bold text-[#1b4332]">
                <span className="text-[1.1rem] font-bold">Lokasi Penjemputan</span>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-[#dfe3dc] bg-white px-3 py-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#edf3ee] text-[#1b4332]">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[0.96rem] font-semibold text-[#1b4332]">Warteg Bahagia - Banda Aceh</p>
                    <p className="text-[0.7rem] text-[#5c6962]">Jl. Syech Abdurrauf No. 12, Kota Banda Aceh</p>
                  </div>
                </div>
                <button type="button" className="rounded-full border border-[#dfe3dc] bg-[#f2f3f0] px-3 py-1.5 text-[0.72rem] font-semibold text-[#1b4332]">
                  Ubah
                </button>
              </div>
            </section>

            <div className="rounded-[1.1rem] border border-[#dfe3dc] bg-[#f8f7f2] p-3">
              <label className="flex items-start gap-3 text-[0.8rem] text-[#4f5f57]">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-[#7b8a81] text-[#1b4332] focus:ring-[#1b4332]" defaultChecked />
                <span>
                  Saya menyetujui bahwa makanan ini masih aman dikonsumsi dan informasi yang diberikan sesuai dengan keadaan aslinya.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-4 pt-2">
              <button
                type="button"
                className="rounded-full bg-[#d9534f] px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#c94a46]"
              >
                Batalkan
              </button>
              <button
                type="button"
                className="rounded-full bg-[#1b4332] px-7 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#153b2d]"
              >
                Posting Sekarang
              </button>
            </div>
          </div>
        </div>
      </div>
    </PenjualLayout>
  )
}
