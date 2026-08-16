import React, { useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { AlertTriangle, ShieldAlert, CheckCircle2, UserX, AlertCircle, Search, Filter, MessageSquare, Clock, Eye, X, Check } from 'lucide-react'

type ModerationReport = {
  id: string
  pelapor: string
  pelaporEmail: string
  terlapor: string
  terlaporEmail: string
  terlaporRole: 'penjual' | 'pembeli' | 'peternak'
  kategori: string
  alasan: string
  buktiUrl?: string
  status: 'open' | 'diproses' | 'selesai'
  created_at: string
  tindakanAdmin?: string
}

const initialReports: ModerationReport[] = [
  {
    id: 'rep-101',
    pelapor: 'Ahmad Fauzi (Pembeli)',
    pelaporEmail: 'ahmad.fauzi@gmail.com',
    terlapor: 'Warung Barokah Subur',
    terlaporEmail: 'warung.barokah@gmail.com',
    terlaporRole: 'penjual',
    kategori: 'Makanan Tidak Sesuai Deskripsi',
    alasan: 'Postingan menyebutkan 5 porsi nasi goreng masih hangat & layak, namun saat diambil pesanan basi dan tidak sesuai jumlah.',
    buktiUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop',
    status: 'open',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'rep-102',
    pelapor: 'Rahmat Maggot Aceh (Peternak)',
    pelaporEmail: 'rahmat.maggot@gmail.com',
    terlapor: 'Catering Syariah Banda',
    terlaporEmail: 'catering.syariah@gmail.com',
    terlaporRole: 'penjual',
    kategori: 'Penjual Tidak Kunjung Ditemui',
    alasan: 'Jadwal pengambilan limbah organik jam 16:00 WIB, tetapi lokasi toko tutup dan nomor HP penjual tidak aktif selama 3 jam.',
    buktiUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop',
    status: 'diproses',
    created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
    tindakanAdmin: 'Peringatan pertama dikirim via WhatsApp admin.',
  },
  {
    id: 'rep-103',
    pelapor: 'Siti Sarah (Pembeli)',
    pelaporEmail: 'siti.sarah@gmail.com',
    terlapor: 'Resto Seafood Lamnyong',
    terlaporEmail: 'seafood.lamnyong@gmail.com',
    terlaporRole: 'penjual',
    kategori: 'Batas Waktu Pengambilan Kadaluarsa',
    alasan: 'Menu yang dipesan sudah kadaluarsa saat jam titik penguncian belum tercapai.',
    buktiUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
    status: 'selesai',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    tindakanAdmin: 'Pengembalian dana diproses, penjual diberi peringatan tertulis.',
  },
]

export default function ModerasiLaporan() {
  const [reports, setReports] = useState<ModerationReport[]>(initialReports)
  const [activeStatus, setActiveStatus] = useState<'open' | 'diproses' | 'selesai' | 'semua'>('open')
  const [searchQuery, setSearchQuery] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Action Modal State
  const [selectedReport, setSelectedReport] = useState<ModerationReport | null>(null)
  const [actionType, setActionType] = useState<'warning' | 'suspend' | 'resolve' | null>(null)
  const [adminNote, setAdminNote] = useState('')

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Handle Admin Action Submission
  const handleExecuteAction = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReport || !actionType) return

    let noteText = adminNote.trim()
    if (actionType === 'warning') {
      noteText = `[Peringatan Dikirim] ${noteText || 'Teguran resmi atas pelanggaran deskripsi/layanan.'}`
    } else if (actionType === 'suspend') {
      noteText = `[Akun Disuspend] ${noteText || 'Akun ditangguhkan sementara selama 7 hari.'}`
    } else if (actionType === 'resolve') {
      noteText = `[Selesai Ditolak/Diselesaikan] ${noteText || 'Masalah telah ditangani oleh tim moderasi.'}`
    }

    setReports((prev) =>
      prev.map((rep) =>
        rep.id === selectedReport.id
          ? {
              ...rep,
              status: actionType === 'resolve' ? 'selesai' : 'diproses',
              tindakanAdmin: noteText,
            }
          : rep
      )
    )

    showToast(`Tindakan moderasi untuk "${selectedReport.terlapor}" berhasil diterapkan!`)
    setSelectedReport(null)
    setActionType(null)
    setAdminNote('')
  }

  const filteredReports = reports.filter((rep) => {
    const matchesStatus = activeStatus === 'semua' ? true : rep.status === activeStatus
    const matchesSearch =
      searchQuery === '' ||
      rep.pelapor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.terlapor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.kategori.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesSearch
  })

  const openCount = reports.filter((r) => r.status === 'open').length
  const processCount = reports.filter((r) => r.status === 'diproses').length
  const resolvedCount = reports.filter((r) => r.status === 'selesai').length

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

        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-abisOrange">
              <ShieldAlert className="w-4 h-4" /> PENGAWASAN & KEPATUHAN KOMUNITAS
            </div>
            <h1 className="text-3xl font-literata font-bold text-abisGreen mt-1">Moderasi & Laporan Pengguna</h1>
            <p className="text-sm text-slate-500 mt-1">
              Tinjau laporan pelanggaran, berikan teguran resmi, atau tangguhkan akun (suspend) demi menjaga integritas platform.
            </p>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama pelapor / terlapor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#fbf9f3] border border-slate-200 rounded-full py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-abisGreen text-slate-800"
            />
          </div>
        </div>

        {/* METRICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-red-50 border border-red-200 text-red-900 p-5 rounded-3xl shadow-sm space-y-2">
            <div className="flex items-center justify-between text-red-600">
              <span className="text-xs font-bold uppercase tracking-wider">Laporan Baru (Open)</span>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <p className="text-4xl font-bold font-literata text-red-700">{openCount}</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-5 rounded-3xl shadow-sm space-y-2">
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-xs font-bold uppercase tracking-wider">Sedang Diproses</span>
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-4xl font-bold font-literata text-amber-800">{processCount}</p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-5 rounded-3xl shadow-sm space-y-2">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-xs font-bold uppercase tracking-wider">Selesai Ditangani</span>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-4xl font-bold font-literata text-emerald-800">{resolvedCount}</p>
          </div>
        </div>

        {/* STATUS FILTER TABS */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveStatus('open')}
            className={`px-5 py-2.5 rounded-full font-bold text-xs transition flex items-center gap-2 ${
              activeStatus === 'open'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Laporan Baru</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px]">{openCount}</span>
          </button>

          <button
            onClick={() => setActiveStatus('diproses')}
            className={`px-5 py-2.5 rounded-full font-bold text-xs transition flex items-center gap-2 ${
              activeStatus === 'diproses'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Sedang Diproses</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px]">{processCount}</span>
          </button>

          <button
            onClick={() => setActiveStatus('selesai')}
            className={`px-5 py-2.5 rounded-full font-bold text-xs transition flex items-center gap-2 ${
              activeStatus === 'selesai'
                ? 'bg-abisGreen text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Selesai</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px]">{resolvedCount}</span>
          </button>

          <button
            onClick={() => setActiveStatus('semua')}
            className={`px-5 py-2.5 rounded-full font-bold text-xs transition ${
              activeStatus === 'semua'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Semua ({reports.length})
          </button>
        </div>

        {/* REPORTS LIST */}
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4 transition hover:shadow-md"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-[10px] font-bold uppercase tracking-wider">
                      {report.kategori}
                    </span>
                    <span className="text-xs text-slate-400">
                      ID: #{report.id} • {new Date(report.created_at).toLocaleString('id-ID')}
                    </span>
                  </div>
                  
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
                    <span>Pelapor: <strong className="text-slate-900">{report.pelapor}</strong> ({report.pelaporEmail})</span>
                    <span>→</span>
                    <span>Terlapor: <strong className="text-red-600">{report.terlapor}</strong> ({report.terlaporRole.toUpperCase()})</span>
                  </div>
                </div>

                <div>
                  {report.status === 'open' && (
                    <span className="px-3.5 py-1.5 rounded-full bg-red-100 text-red-800 text-xs font-bold border border-red-300 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" /> Butuh Respon Admin
                    </span>
                  )}
                  {report.status === 'diproses' && (
                    <span className="px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> Sedang Diproses
                    </span>
                  )}
                  {report.status === 'selesai' && (
                    <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Selesai Ditangani
                    </span>
                  )}
                </div>
              </div>

              {/* REPORT CONTENT & EVIDENCE */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#fbf9f3] p-4 rounded-2xl border border-slate-200/70">
                <div className="lg:col-span-8 space-y-2">
                  <h4 className="text-xs font-bold uppercase text-slate-500">Rincian Keluhan & Pelanggaran</h4>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">{report.alasan}</p>

                  {report.tindakanAdmin && (
                    <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 text-xs">
                      <span className="font-bold text-abisGreen block">Catatan/Tindakan Admin:</span>
                      <p className="text-slate-600 mt-0.5">{report.tindakanAdmin}</p>
                    </div>
                  )}
                </div>

                {report.buktiUrl && (
                  <div className="lg:col-span-4 space-y-1">
                    <h4 className="text-xs font-bold uppercase text-slate-500">Foto Bukti Lampiran</h4>
                    <div className="h-28 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 relative group">
                      <img src={report.buktiUrl} alt="Bukti Pelanggaran" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setSelectedReport(report)
                    setActionType('warning')
                  }}
                  className="px-4 py-2 rounded-full border border-amber-300 bg-amber-50 text-amber-800 font-bold text-xs hover:bg-amber-100 transition flex items-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" /> Beri Peringatan
                </button>

                <button
                  onClick={() => {
                    setSelectedReport(report)
                    setActionType('suspend')
                  }}
                  className="px-4 py-2 rounded-full border border-red-300 bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 transition flex items-center gap-1.5"
                >
                  <UserX className="w-4 h-4" /> Suspend Akun Terlapor
                </button>

                <button
                  onClick={() => {
                    setSelectedReport(report)
                    setActionType('resolve')
                  }}
                  className="px-5 py-2 rounded-full bg-abisGreen text-white font-bold text-xs hover:bg-[#0e2718] transition flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Selesaikan Laporan
                </button>
              </div>
            </div>
          ))}

          {filteredReports.length === 0 && (
            <div className="py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-base text-slate-800">Tidak ada laporan pada kategori ini</h3>
              <p className="text-xs text-slate-500">Semua keluhan pengguna telah ditangani dengan aman.</p>
            </div>
          )}
        </div>

      </div>

      {/* ACTION MODAL */}
      {selectedReport && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-literata font-bold text-lg text-abisGreen">
                {actionType === 'warning' && 'Kirim Peringatan Resmi'}
                {actionType === 'suspend' && 'Tangguhkan / Suspend Akun'}
                {actionType === 'resolve' && 'Tandai Laporan Selesai'}
              </h3>
              <button
                onClick={() => {
                  setSelectedReport(null)
                  setActionType(null)
                }}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Sasaran Pengguna Terlapor: <strong className="text-slate-900">{selectedReport.terlapor}</strong> ({selectedReport.terlaporRole})
            </p>

            <form onSubmit={handleExecuteAction} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Catatan Tindakan Admin</label>
                <textarea
                  rows={3}
                  required
                  placeholder={
                    actionType === 'warning'
                      ? 'Tulis pesan teguran resmi kepada pemilik akun...'
                      : actionType === 'suspend'
                      ? 'Berikan alasan suspensi akun (misal: Pelanggaran berat deskripsi produk)...'
                      : 'Tuliskan ringkasan resolusi yang diambil...'
                  }
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-abisGreen bg-[#fcfaf7]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReport(null)
                    setActionType(null)
                  }}
                  className="px-5 py-2.5 rounded-full bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 rounded-full text-white font-bold shadow-md ${
                    actionType === 'suspend'
                      ? 'bg-red-600 hover:bg-red-700'
                      : actionType === 'warning'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-abisGreen hover:bg-[#0e2718]'
                  }`}
                >
                  Konfirmasi Tindakan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
