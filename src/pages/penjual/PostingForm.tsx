import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarDays, Camera, MapPin, Tag, Trash2, UtensilsCrossed, Check, Edit2, X } from 'lucide-react'
import PenjualLayout from '../../layouts/PenjualLayout'
import { supabase } from '../../lib/supabase'
import { uploadFoodImage, getFoodImageUrl, resolveFoodImageUrl } from '../../lib/storage'

type StatusKondisi = 'layak' | 'organik'

export default function PenjualPostingForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedStatus, setSelectedStatus] = useState<StatusKondisi>('layak')
  const [loading, setLoading] = useState(false)
  const [fetchingEdit, setFetchingEdit] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [storeName, setStoreName] = useState('')

  // Image Upload states
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Success Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Location edit states
  const [lokasiNama, setLokasiNama] = useState('Lokasi Penjemputan')
  const [lokasiAlamat, setLokasiAlamat] = useState('Banda Aceh')
  const [isEditingLocation, setIsEditingLocation] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(true)

  const [form, setForm] = useState({
    namaMakanan: '',
    kadaluarsa: '',
    jumlahPorsi: '',
    deskripsi: '',
    hargaAsli: '',
    hargaJual: '',
  })

  // Load User Business Name, Address and Posting Details
  useEffect(() => {
    const initPageData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('nama_usaha, name, alamat')
          .eq('id', session.user.id)
          .single()

        if (userProfile) {
          const fetchedName = userProfile.nama_usaha || userProfile.name || session.user.user_metadata?.name || 'Penjual'
          const fetchedAddress = userProfile.alamat || 'Kota Banda Aceh'
          setStoreName(fetchedName)
          setLokasiNama(fetchedName)
          setLokasiAlamat(fetchedAddress)
        }
      }

      if (!editId) return

      setFetchingEdit(true)
      setError(null)
      const { data, error: fetchErr } = await supabase
        .from('postingan_makanan')
        .select('*')
        .eq('id', editId)
        .single()

      if (fetchErr || !data) {
        setError('Gagal memuat data postingan untuk diedit.')
      } else {
        const formattedDate = data.batas_waktu_ambil
          ? new Date(data.batas_waktu_ambil).toISOString().split('T')[0]
          : ''

        setForm({
          namaMakanan: data.nama_makanan || '',
          kadaluarsa: formattedDate,
          jumlahPorsi: data.jumlah ? String(data.jumlah) : '1',
          deskripsi: data.deskripsi || '',
          hargaAsli: data.harga ? String(data.harga * 2) : '',
          hargaJual: data.harga ? String(data.harga) : '',
        })
        setSelectedStatus(data.status === 'tidak_layak_konsumsi' ? 'organik' : 'layak')

        if (data.foto_url) {
          setImagePreview(resolveFoodImageUrl(data.foto_url))
        }
      }
      setFetchingEdit(false)
    }

    initPageData()
  }, [editId])

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Handle Photo Selection
  const handleImageSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError('Ukuran foto terlalu besar. Maksimal 10MB.')
      return
    }
    setError(null)
    setImageFile(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSelect(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Dynamic Discount Calculator
  const discountLabel = (() => {
    const asli = Number(form.hargaAsli)
    const jual = Number(form.hargaJual)
    if (asli > 0 && jual > 0 && asli > jual) {
      const pct = Math.round(((asli - jual) / asli) * 100)
      return `DISKON ${pct}%`
    }
    return null
  })()

  const isLayak = selectedStatus === 'layak'

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isConfirmed) {
      setError('Anda harus menyetujui pernyataan kelayakan makanan terlebih dahulu.')
      return
    }

    setError(null)
    setLoading(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      setError('Sesi login tidak ditemukan. Silakan masuk ulang.')
      setLoading(false)
      return
    }

    // Handle photo upload to Supabase storage or fallback to base64 preview
    let finalFotoUrl: string | null = imagePreview

    if (imageFile) {
      try {
        const path = `food_${session.user.id}_${Date.now()}`
        const uploadedPath = await uploadFoodImage(imageFile, path)
        if (uploadedPath) {
          finalFotoUrl = getFoodImageUrl(uploadedPath)
        }
      } catch (uploadErr) {
        console.warn('Storage upload error, using base64 preview image fallback:', uploadErr)
        finalFotoUrl = imagePreview
      }
    }

    const parsedPrice = Number(form.hargaJual || form.hargaAsli || 0)
    const parsedAmount = Number(form.jumlahPorsi)
    const amount = Number.isFinite(parsedAmount) && parsedAmount >= 0 ? parsedAmount : 0
    const pickupDate = form.kadaluarsa ? `${form.kadaluarsa}T18:00:00.000Z` : null
    const status = amount <= 0 ? 'habis' : (selectedStatus === 'layak' ? 'layak_jual' : 'tidak_layak_konsumsi')

    const payload = {
      penjual_id: session.user.id,
      nama_makanan: form.namaMakanan.trim(),
      jumlah: amount,
      status,
      harga: Number.isFinite(parsedPrice) ? parsedPrice : 0,
      batas_waktu_ambil: pickupDate,
      foto_url: finalFotoUrl,
    }

    let saveError = null

    if (editId) {
      const { error: updateError } = await supabase
        .from('postingan_makanan')
        .update(payload)
        .eq('id', editId)
      saveError = updateError
    } else {
      const { error: insertError } = await supabase.from('postingan_makanan').insert({
        ...payload,
        lokasi_lat: null,
        lokasi_lng: null,
      })
      saveError = insertError
    }

    if (saveError) {
      setError(saveError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    setShowSuccessModal(true)
  }

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
    navigate('/penjual')
  }

  return (
    <PenjualLayout>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/png, image/jpeg, image/webp, image/jpg"
        className="hidden"
      />

      <form onSubmit={handleSubmit} className="mx-auto max-w-[1180px] py-6">
        <div className="mb-6">
          <h1 className="font-literata text-[2.2rem] font-bold leading-none text-[#1b4332]">
            {editId ? 'Edit Postingan Makanan' : 'Buat Postingan Baru'}
          </h1>
          <p className="mt-2 max-w-xl text-[0.96rem] text-[#42564e]">
            {editId
              ? 'Perbarui detail postingan makanan Anda untuk memberikan informasi terbaru kepada pembeli'
              : 'Detailkan sisa makanan Anda untuk mengurangi limbah dan menghasilkan dampak'}
          </p>
        </div>

        {fetchingEdit ? (
          <div className="py-12 text-center font-bold text-abisGreen animate-pulse bg-white rounded-3xl border border-slate-100">
            Memuat data postingan...
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <section className="rounded-[1.7rem] border border-[#dfe3dc] bg-[#f8f7f2] p-5 shadow-[0_1px_0_rgba(29,54,42,0.04)]">
                <div className="mb-4 flex items-center gap-3 text-[1.1rem] font-bold text-[#1b4332]">
                  <span className="text-[1.1rem] font-bold">Media Makanan</span>
                </div>

                {/* IMAGE UPLOADER CARD */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="group relative flex min-h-[250px] cursor-pointer items-center justify-center overflow-hidden rounded-[1.1rem] border-2 border-dashed border-[#b8bcb6] bg-[#eef0ec] px-4 text-center transition hover:border-[#1b4332]"
                >
                  {imagePreview ? (
                    <div className="relative h-full w-full">
                      <img
                        src={imagePreview}
                        alt="Preview Makanan"
                        className="h-64 w-full rounded-[0.9rem] object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3 text-white">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            fileInputRef.current?.click()
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-white/90 text-[#1b4332] font-bold text-xs rounded-full shadow-md hover:bg-white"
                        >
                          <Camera className="w-4 h-4" /> Ganti Foto
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-600/90 text-white font-bold text-xs rounded-full shadow-md hover:bg-red-600"
                        >
                          <Trash2 className="w-4 h-4" /> Hapus
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 py-8">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#dbe6d9] text-[#1b4332] group-hover:scale-110 transition">
                        <Camera className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1b4332]">Klik atau Tarik Foto Makanan Ke Sini</p>
                        <p className="text-xs text-[#516159] mt-1">Pilih foto berkualitas baik agar menarik pembeli</p>
                      </div>
                      <p className="text-[0.72rem] font-bold uppercase tracking-wider text-[#7a867d]">PNG, JPG, WEBP (Maksimal 10MB)</p>
                    </div>
                  )}
                </div>

                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-[#1b4332]">Nama Makanan</span>
                    <input
                      required
                      value={form.namaMakanan}
                      onChange={(event) => updateField('namaMakanan', event.target.value)}
                      placeholder="Contoh: Tumis Kangkung / Nasi Goreng"
                      className="w-full rounded-xl border border-[#a6aea5] bg-white px-3 py-3 text-[0.96rem] text-[#1b4332] outline-none placeholder:text-[#7b8a81]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-[#1b4332]">Batas Waktu Pengambilan / Kadaluwarsa</span>
                    <div className="relative">
                      <input
                        type="date"
                        value={form.kadaluarsa}
                        onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                        onChange={(event) => updateField('kadaluarsa', event.target.value)}
                        className="w-full rounded-xl border border-[#a6aea5] bg-white px-3 py-3 pr-11 text-[0.96rem] text-[#1b4332] outline-none"
                      />
                      <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1b4332]" />
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
                    <span className="mt-2 text-[0.8rem] leading-relaxed text-[#4f5f57]">Siap makan, bisa berkualitas tinggi</span>
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

                {discountLabel ? (
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-[#f0d3a8] bg-[#fef6eb] px-3 py-2 text-[#9d5d19]">
                    <span className="inline-flex items-center gap-2 text-sm font-bold">
                      <Tag className="h-4 w-4" />
                      {discountLabel}
                    </span>
                    <span className="text-[0.7rem] text-[#9d5d19]">Hemat dan ramah lingkungan</span>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-[#dfe3dc] bg-white px-3 py-2 text-[#7b8a81]">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold">
                      <Tag className="h-4 w-4 text-[#7b8a81]" />
                      Harga Normal / Tanpa Diskon
                    </span>
                    <span className="text-[0.7rem]">Masukkan harga asli & harga jual</span>
                  </div>
                )}
              </section>

              {/* LOKASI PENJEMPUTAN WITH EDITABLE MODAL / INPUT */}
              <section className="rounded-[1.7rem] border border-[#dfe3dc] bg-[#f8f7f2] p-5 shadow-[0_1px_0_rgba(29,54,42,0.04)]">
                <div className="mb-4 flex items-center justify-between gap-3 text-[1.1rem] font-bold text-[#1b4332]">
                  <span>Lokasi Penjemputan</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingLocation(!isEditingLocation)}
                    className="flex items-center gap-1.5 rounded-full border border-[#1b4332] bg-white px-3 py-1 text-[0.75rem] font-bold text-[#1b4332] hover:bg-[#1b4332] hover:text-white transition"
                  >
                    {isEditingLocation ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                    {isEditingLocation ? 'Batal' : 'Ubah Lokasi'}
                  </button>
                </div>

                {isEditingLocation ? (
                  <div className="space-y-3 rounded-xl border border-[#1b4332]/30 bg-white p-4 shadow-sm">
                    <label className="block">
                      <span className="mb-1 block text-xs font-bold text-[#1b4332]">Nama Tempat / Usaha</span>
                      <input
                        type="text"
                        value={lokasiNama}
                        onChange={(e) => setLokasiNama(e.target.value)}
                        placeholder="Contoh: Toko Berkah"
                        className="w-full rounded-lg border border-[#a6aea5] px-3 py-2 text-xs outline-none text-[#1b4332]"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-bold text-[#1b4332]">Alamat Lengkap Penjemputan</span>
                      <textarea
                        value={lokasiAlamat}
                        onChange={(e) => setLokasiAlamat(e.target.value)}
                        placeholder="Contoh: Jl. Syech Abdurrauf No. 12, Syiah Kuala, Banda Aceh"
                        rows={2}
                        className="w-full rounded-lg border border-[#a6aea5] px-3 py-2 text-xs outline-none text-[#1b4332]"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsEditingLocation(false)}
                      className="w-full py-2 bg-[#1b4332] text-white font-bold text-xs rounded-lg hover:bg-[#14342a] transition flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Simpan Lokasi Penjemputan
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[#dfe3dc] bg-white px-3 py-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#edf3ee] text-[#1b4332]">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[0.96rem] font-semibold text-[#1b4332]">{lokasiNama}</p>
                        <p className="text-[0.7rem] text-[#5c6962]">{lokasiAlamat}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingLocation(true)}
                      className="rounded-full border border-[#dfe3dc] bg-[#f2f3f0] px-3.5 py-1.5 text-[0.72rem] font-bold text-[#1b4332] hover:bg-[#1b4332] hover:text-white transition"
                    >
                      Ubah
                    </button>
                  </div>
                )}
              </section>

              <div className="rounded-[1.1rem] border border-[#dfe3dc] bg-[#f8f7f2] p-3">
                <label className="flex items-start gap-3 text-[0.8rem] text-[#4f5f57] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isConfirmed}
                    onChange={(e) => setIsConfirmed(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-[#7b8a81] text-[#1b4332] focus:ring-[#1b4332]"
                  />
                  <span>
                    Saya menyetujui bahwa makanan ini masih aman dikonsumsi dan informasi yang diberikan sesuai dengan keadaan aslinya.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/penjual')}
                  className="rounded-full bg-[#d9534f] px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#c94a46]"
                >
                  Batalkan
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-[#1b4332] px-7 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#153b2d] disabled:cursor-not-allowed disabled:opacity-70 flex items-center gap-2"
                >
                  {loading ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Posting Sekarang'}
                </button>
              </div>
              {error && (
                <p className="pt-4 text-right text-sm font-medium text-red-600">{error}</p>
              )}
            </div>
          </div>
        )}
      </form>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#e3f4e9]">
              <Check className="h-10 w-10 text-abisGreen" />
            </div>
            <h3 className="font-literata text-2xl font-bold text-[#1b4332] mb-2">
              Berhasil!
            </h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              Postingan makanan surplus Anda telah berhasil dipublikasikan dan bisa dilihat oleh pembeli.
            </p>
            <button
              type="button"
              onClick={handleCloseSuccessModal}
              className="w-full rounded-full bg-abisGreen py-3.5 font-bold text-white shadow-lg shadow-abisGreen/20 transition hover:bg-[#153b2d]"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      )}
    </PenjualLayout>
  )
}

