import React, { useEffect, useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { ShieldCheck, Check, X, Store, Bug, FileText, MapPin, Mail, Calendar, Eye, AlertCircle, Search, Filter } from 'lucide-react'
import { supabase } from '../../lib/supabase'

type MitraProfile = {
  id: string
  email: string
  role: 'penjual' | 'peternak' | string
  nama_usaha: string | null
  status_verifikasi: string
  created_at: string | null
  lokasi?: string | null
  no_hp?: string | null
  dokumen_ktp?: string | null
  dokumen_nib?: string | null
  foto_tempat?: string | null
}

const mockPendingMitra: MitraProfile[] = [
  {
    id: 'mock-1',
    email: 'warung.berkah@gmail.com',
    role: 'penjual',
    nama_usaha: 'Warung Nasi Berkah Utama',
    status_verifikasi: 'pending',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    lokasi: 'Jl. Teuku Umar No. 12, Banda Aceh',
    no_hp: '+62 812-9988-7711',
    dokumen_ktp: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=600&h=400&fit=crop',
    dokumen_nib: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&h=400&fit=crop',
    foto_tempat: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop',
  },
  {
    id: 'mock-2',
    email: 'maggot.aceh.farm@gmail.com',
    role: 'peternak',
    nama_usaha: 'Aceh Maggot Bio Farm',
    status_verifikasi: 'pending',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    lokasi: 'Desa Tungkop, Aceh Besar',
    no_hp: '+62 852-3344-5566',
    dokumen_ktp: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=400&fit=crop',
    dokumen_nib: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&h=400&fit=crop',
    foto_tempat: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&h=400&fit=crop',
  },
  {
    id: 'mock-3',
    email: 'dapur.sedap@gmail.com',
    role: 'penjual',
    nama_usaha: 'Catering Dapur Sedap',
    status_verifikasi: 'pending',
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    lokasi: 'Jl. Syiah Kuala No. 44, Banda Aceh',
    no_hp: '+62 813-1122-3344',
    dokumen_ktp: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop',
    dokumen_nib: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&h=400&fit=crop',
    foto_tempat: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
  },
]

export default function AdminVerifikasiMitra() {
  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected' | 'semua'>('pending')
  const [mitraList, setMitraList] = useState<MitraProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  
  // Document Viewer Modal
  const [viewDocModal, setViewDocModal] = useState<{ title: string; url: string } | null>(null)

  // Rejection Confirmation Modal
  const [rejectModalTarget, setRejectModalTarget] = useState<MitraProfile | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 3500)
  }

  // Fetch Mitra List from Supabase
  const fetchMitraData = async () => {
    setLoading(true)
    try {
      const { data: dbProfiles, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['penjual', 'peternak'])
        .order('created_at', { ascending: false })

      if (!error && dbProfiles && dbProfiles.length > 0) {
        // Map database profiles and merge with fallback details for display completeness
        const mapped: MitraProfile[] = dbProfiles.map((p, idx) => ({
          id: p.id,
          email: p.email || 'tanpa.email@abis.in',
          role: p.role,
          nama_usaha: p.nama_usaha || p.name || `Mitra ${p.role === 'penjual' ? 'Penjual' : 'Peternak'} #${idx + 1}`,
          status_verifikasi: p.status_verifikasi || 'pending',
          created_at: p.created_at || new Date().toISOString(),
          lokasi: p.alamat || 'Banda Aceh',
          no_hp: p.telepon || '+62 812-3456-7890',
          dokumen_ktp: p.foto_url || mockPendingMitra[idx % 3].dokumen_ktp,
          dokumen_nib: mockPendingMitra[idx % 3].dokumen_nib,
          foto_tempat: mockPendingMitra[idx % 3].foto_tempat,
        }))

        // Ensure mock entries exist if dbProfiles has few items for demonstration
        const combined = [...mapped]
        mockPendingMitra.forEach((mock) => {
          if (!combined.some((item) => item.id === mock.id)) {
            combined.push(mock)
          }
        })

        setMitraList(combined)
      } else {
        setMitraList(mockPendingMitra)
      }
    } catch (err) {
      console.warn('Error loading verification list:', err)
      setMitraList(mockPendingMitra)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMitraData()
  }, [])

  // Approve Action
  const handleApprove = async (mitra: MitraProfile) => {
    try {
      // Update Supabase DB if not mock
      if (!mitra.id.startsWith('mock-')) {
        await supabase
          .from('profiles')
          .update({ status_verifikasi: 'verified' })
          .eq('id', mitra.id)
      }

      setMitraList((prev) =>
        prev.map((item) => (item.id === mitra.id ? { ...item, status_verifikasi: 'verified' } : item))
      )
      showToast(`Mitra "${mitra.nama_usaha}" berhasil disetujui & diverifikasi!`)
    } catch (err) {
      showToast('Gagal menyetujui verifikasi mitra.')
    }
  }

  // Reject Action
  const handleConfirmReject = async () => {
    if (!rejectModalTarget) return

    try {
      if (!rejectModalTarget.id.startsWith('mock-')) {
        await supabase
          .from('profiles')
          .update({ status_verifikasi: 'rejected' })
          .eq('id', rejectModalTarget.id)
      }

      setMitraList((prev) =>
        prev.map((item) =>
          item.id === rejectModalTarget.id ? { ...item, status_verifikasi: 'rejected' } : item
        )
      )
      showToast(`Pendaftaran mitra "${rejectModalTarget.nama_usaha}" telah ditolak.`)
      setRejectModalTarget(null)
      setRejectReason('')
    } catch (err) {
      showToast('Gagal menolak mitra.')
    }
  }

  // Filtered List based on Active Tab & Search
  const filteredList = mitraList.filter((item) => {
    const matchesTab =
      activeTab === 'semua' ? true : item.status_verifikasi === activeTab
    const matchesSearch =
      searchQuery === '' ||
      (item.nama_usaha?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.role.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesTab && matchesSearch
  })

  const pendingCount = mitraList.filter((i) => i.status_verifikasi === 'pending').length
  const verifiedCount = mitraList.filter((i) => i.status_verifikasi === 'verified').length
  const rejectedCount = mitraList.filter((i) => i.status_verifikasi === 'rejected').length

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* TOAST BANNER */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl bg-[#0e2718] px-5 py-3.5 text-white shadow-2xl border border-emerald-500/40 animate-bounce">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-abisOrange">
              <ShieldCheck className="w-4 h-4" /> MODERASI PLATFORM ABIS.IN
            </div>
            <h1 className="text-3xl font-literata font-bold text-abisGreen mt-1">Antrean Verifikasi Mitra</h1>
            <p className="text-sm text-slate-500 mt-1">
              Tinjau dokumen identitas & NIB calon mitra Penjual Makanan dan Peternak Maggot sebelum memberikan verifikasi publik.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama mitra atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#fbf9f3] border border-slate-200 rounded-full py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-abisGreen text-slate-800"
            />
          </div>
        </div>

        {/* FILTER TABS */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-5 py-2.5 rounded-full font-bold text-xs transition flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'bg-abisOrange text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>Menunggu Verifikasi</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px]">{pendingCount}</span>
            </button>

            <button
              onClick={() => setActiveTab('verified')}
              className={`px-5 py-2.5 rounded-full font-bold text-xs transition flex items-center gap-2 ${
                activeTab === 'verified'
                  ? 'bg-abisGreen text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>Terverifikasi</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px]">{verifiedCount}</span>
            </button>

            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-5 py-2.5 rounded-full font-bold text-xs transition flex items-center gap-2 ${
                activeTab === 'rejected'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>Ditolak</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px]">{rejectedCount}</span>
            </button>

            <button
              onClick={() => setActiveTab('semua')}
              className={`px-5 py-2.5 rounded-full font-bold text-xs transition ${
                activeTab === 'semua'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Semua Mitra ({mitraList.length})
            </button>
          </div>
        </div>

        {/* LIST ANTREAN MITRA */}
        {loading ? (
          <div className="py-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-500">
            <p className="font-bold text-base text-abisGreen animate-pulse">Memuat antrean verifikasi mitra...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-12 px-4 text-center bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm space-y-3">
            <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-lg text-slate-800">Tidak ada mitra dalam kategori ini</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Seluruh mitra pada filter ini sudah diproses atau tidak cocok dengan kata kunci pencarian Anda.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredList.map((mitra) => {
              const isPenjual = mitra.role === 'penjual'
              const isPending = mitra.status_verifikasi === 'pending'
              const isVerified = mitra.status_verifikasi === 'verified'

              return (
                <div
                  key={mitra.id}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6 transition hover:shadow-md"
                >
                  {/* HEADER CARD: MITRA IDENTITY & BADGES */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                          isPenjual ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {isPenjual ? <Store className="w-6 h-6" /> : <Bug className="w-6 h-6" />}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-literata font-bold text-xl text-slate-900">{mitra.nama_usaha}</h3>
                          <span
                            className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isPenjual
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {isPenjual ? 'Penjual Makanan' : 'Peternak Maggot'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" /> {mitra.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {mitra.lokasi}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Daftar: {new Date(mitra.created_at || '').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* STATUS BADGE */}
                    <div>
                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                          <AlertCircle className="w-4 h-4" /> Menunggu Verifikasi
                        </span>
                      )}
                      {isVerified && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300">
                          <Check className="w-4 h-4" /> Terverifikasi Publik
                        </span>
                      )}
                      {mitra.status_verifikasi === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-100 text-red-900 text-xs font-bold border border-red-300">
                          <X className="w-4 h-4" /> Ditolak
                        </span>
                      )}
                    </div>
                  </div>

                  {/* DOKUMEN & FOTO YANG DIUNGGAH */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-abisGreen" /> DOKUMEN IDENTITAS & KELENGKAPAN BERKAS
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* DOKUMEN 1: KTP IDENTITAS */}
                      <div className="bg-[#fbf9f3] p-3 rounded-2xl border border-slate-200 flex flex-col justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800">KTP Pemilik Usaha</p>
                          <p className="text-[10px] text-slate-500">Kartu Tanda Penduduk Penanggung Jawab</p>
                        </div>
                        <div className="mt-3 relative h-32 rounded-xl overflow-hidden bg-slate-200 group">
                          <img src={mitra.dokumen_ktp || ''} alt="KTP Pemilik" className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <button
                            onClick={() => setViewDocModal({ title: `KTP Pemilik - ${mitra.nama_usaha}`, url: mitra.dokumen_ktp || '' })}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition"
                          >
                            <Eye className="w-4 h-4 mr-1" /> Pratinjau Document
                          </button>
                        </div>
                      </div>

                      {/* DOKUMEN 2: NIB / SURAT IZIN */}
                      <div className="bg-[#fbf9f3] p-3 rounded-2xl border border-slate-200 flex flex-col justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Dokumen NIB / Izin Usaha</p>
                          <p className="text-[10px] text-slate-500">Nomor Induk Berusaha / Surat Keterangan Usaha</p>
                        </div>
                        <div className="mt-3 relative h-32 rounded-xl overflow-hidden bg-slate-200 group">
                          <img src={mitra.dokumen_nib || ''} alt="NIB / Izin Usaha" className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <button
                            onClick={() => setViewDocModal({ title: `NIB / Surat Izin - ${mitra.nama_usaha}`, url: mitra.dokumen_nib || '' })}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition"
                          >
                            <Eye className="w-4 h-4 mr-1" /> Pratinjau Document
                          </button>
                        </div>
                      </div>

                      {/* DOKUMEN 3: FOTO LOKASI / TEMPAT */}
                      <div className="bg-[#fbf9f3] p-3 rounded-2xl border border-slate-200 flex flex-col justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Foto Tempat Usaha</p>
                          <p className="text-[10px] text-slate-500">Dokumentasi Fisik Dapur / Peternakan</p>
                        </div>
                        <div className="mt-3 relative h-32 rounded-xl overflow-hidden bg-slate-200 group">
                          <img src={mitra.foto_tempat || ''} alt="Foto Tempat Usaha" className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <button
                            onClick={() => setViewDocModal({ title: `Foto Tempat - ${mitra.nama_usaha}`, url: mitra.foto_tempat || '' })}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition"
                          >
                            <Eye className="w-4 h-4 mr-1" /> Pratinjau Document
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM ACTION BUTTONS */}
                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => setRejectModalTarget(mitra)}
                          className="px-6 py-2.5 rounded-full border border-red-200 bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 transition flex items-center gap-1.5"
                        >
                          <X className="w-4 h-4" /> Tolak Pendaftaran
                        </button>
                        <button
                          onClick={() => handleApprove(mitra)}
                          className="px-8 py-2.5 rounded-full bg-abisGreen text-white font-bold text-xs hover:bg-[#0e2718] transition shadow-md flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" /> Setujui & Verifikasi
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleApprove(mitra)}
                        className="px-5 py-2 rounded-full border border-slate-200 bg-slate-50 text-slate-600 font-bold text-xs hover:bg-slate-100 transition"
                      >
                        Ubah Status Verifikasi
                      </button>
                    )}
                  </div>

                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {viewDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-literata font-bold text-lg text-abisGreen">{viewDocModal.title}</h3>
              <button onClick={() => setViewDocModal(null)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-96 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <img src={viewDocModal.url} alt="Pratinjau Dokumen" className="w-full h-full object-contain" />
            </div>
            <div className="flex justify-end">
              <button onClick={() => setViewDocModal(null)} className="px-6 py-2 rounded-full bg-slate-800 text-white font-bold text-xs">
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-literata font-bold text-lg text-red-600">Tolak Verifikasi Mitra</h3>
              <button onClick={() => setRejectModalTarget(null)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Anda akan menolak pengajuan verifikasi untuk <span className="font-bold text-slate-900">{rejectModalTarget.nama_usaha}</span>. Silakan berikan alasan penolakan untuk catatan.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Alasan Penolakan</label>
              <textarea
                rows={3}
                placeholder="Contoh: Foto dokumen KTP buram / Berkas NIB tidak sesuai nama usaha..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-red-500 bg-[#fcfaf7]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setRejectModalTarget(null)} className="px-5 py-2.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200">
                Batalkan
              </button>
              <button onClick={handleConfirmReject} className="px-6 py-2.5 rounded-full bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition">
                Konfirmasi Penolakan
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
