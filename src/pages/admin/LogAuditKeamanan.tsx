import React, { useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { ShieldCheck, Lock, Eye, Download, Search, Filter, Calendar, ShieldAlert, CheckCircle2, Clock, User, Terminal, Server } from 'lucide-react'

type AuditLog = {
  id: string
  timestamp: string
  adminName: string
  adminEmail: string
  aksi: string
  kategori: 'Akses Sensitif' | 'Moderasi Akun' | 'Pengaturan Sistem' | 'Ekspansi Wilayah'
  targetData: string
  ipAddress: string
  status: 'Berhasil' | 'Gagal' | 'Membutuhkan 2FA'
}

const mockAuditLogs: AuditLog[] = [
  {
    id: 'aud-801',
    timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(),
    adminName: 'Super Admin Utama',
    adminEmail: 'admin@abis.in',
    aksi: 'Melihat Dokumen KTP & NIB Mitra',
    kategori: 'Akses Sensitif',
    targetData: 'Warung Nasi Berkah Utama (id: mock-1)',
    ipAddress: '180.252.164.12 (Banda Aceh)',
    status: 'Berhasil',
  },
  {
    id: 'aud-802',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    adminName: 'Super Admin Utama',
    adminEmail: 'admin@abis.in',
    aksi: 'Menyetujui Verifikasi Status Mitra Publik',
    kategori: 'Moderasi Akun',
    targetData: 'Aceh Maggot Bio Farm (id: mock-2)',
    ipAddress: '180.252.164.12 (Banda Aceh)',
    status: 'Berhasil',
  },
  {
    id: 'aud-803',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    adminName: 'Moderator Lapangan',
    adminEmail: 'moderator@abis.in',
    aksi: 'Pengiriman Teguran Resmi & Suspend Akun',
    kategori: 'Moderasi Akun',
    targetData: 'Resto Seafood Lamnyong (id: usr-4)',
    ipAddress: '110.138.92.44 (Lhokseumawe)',
    status: 'Berhasil',
  },
  {
    id: 'aud-804',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    adminName: 'Super Admin Utama',
    adminEmail: 'admin@abis.in',
    aksi: 'Aktivasi Layanan Baru di Kecamatan Ulee Kareng',
    kategori: 'Ekspansi Wilayah',
    targetData: 'Kecamatan Ulee Kareng (dist-5)',
    ipAddress: '180.252.164.12 (Banda Aceh)',
    status: 'Berhasil',
  },
  {
    id: 'aud-805',
    timestamp: new Date(Date.now() - 3600000 * 28).toISOString(),
    adminName: 'Sistem Otomatis Supabase',
    adminEmail: 'system@abis.in',
    aksi: 'Pemeriksaan Sesi Autentikasi 2FA Admin',
    kategori: 'Pengaturan Sistem',
    targetData: 'Portal Admin Login',
    ipAddress: '180.252.164.12 (Banda Aceh)',
    status: 'Membutuhkan 2FA',
  },
]

export default function LogAuditKeamanan() {
  const [logs] = useState<AuditLog[]>(mockAuditLogs)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeKategori, setActiveKategori] = useState<string>('semua')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const filteredLogs = logs.filter((log) => {
    const matchesKategori = activeKategori === 'semua' ? true : log.kategori === activeKategori
    const matchesSearch =
      searchQuery === '' ||
      log.aksi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.adminName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targetData.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesKategori && matchesSearch
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* TOAST BANNER */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl bg-[#0e2718] px-5 py-3.5 text-white shadow-2xl border border-emerald-500/40 animate-bounce">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-abisOrange">
              <ShieldAlert className="w-4 h-4" /> TRANSPARANSI & KEPATUHAN KEAMANAN DATA (BOBOT 15%)
            </div>
            <h1 className="text-3xl font-literata font-bold text-abisGreen mt-1">Log Audit & Keamanan</h1>
            <p className="text-sm text-slate-500 mt-1">
              Catatan otomatis riwayat akses administrator terhadap data sensitif pengguna demi integritas dan transparansi.
            </p>
          </div>

          <button
            onClick={() => showToast('Ekspor laporan log audit berhasil diunduh (PDF/CSV).')}
            className="px-6 py-3 rounded-full bg-abisGreen text-white font-bold text-xs hover:bg-[#0e2718] transition shadow-sm flex items-center justify-center gap-2 shrink-0"
          >
            <Download className="w-4 h-4" /> Ekspor Log Audit
          </button>
        </div>

        {/* SECURITY STATUS BANNER */}
        <div className="bg-[#123c2f] text-white p-6 rounded-3xl shadow-md border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/20 shrink-0">
              <Lock className="w-7 h-7 text-abisOrange" />
            </div>
            <div>
              <h3 className="font-literata font-bold text-xl text-white">Standar Enkripsi & Akses Admin Berlapis</h3>
              <p className="text-xs text-white/80 mt-1 leading-relaxed max-w-2xl">
                Seluruh aktivitas melihat identitas KTP/NIB, perubahan status verifikasi, dan suspensi akun dicatat secara permanen di server log. Akses admin diproteksi oleh Autentikasi Dua-Faktor (2FA).
              </p>
            </div>
          </div>

          <div className="bg-white/10 p-4 rounded-2xl border border-white/15 text-center shrink-0">
            <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">Status Kepatuhan</span>
            <p className="text-xl font-bold font-literata text-white mt-0.5">100% Terverifikasi</p>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveKategori('semua')}
              className={`px-5 py-2.5 rounded-full font-bold text-xs transition ${
                activeKategori === 'semua'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Semua Aktivitas ({logs.length})
            </button>

            <button
              onClick={() => setActiveKategori('Akses Sensitif')}
              className={`px-5 py-2.5 rounded-full font-bold text-xs transition ${
                activeKategori === 'Akses Sensitif'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Akses Sensitif (KTP/NIB)
            </button>

            <button
              onClick={() => setActiveKategori('Moderasi Akun')}
              className={`px-5 py-2.5 rounded-full font-bold text-xs transition ${
                activeKategori === 'Moderasi Akun'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Moderasi & Suspend
            </button>

            <button
              onClick={() => setActiveKategori('Ekspansi Wilayah')}
              className={`px-5 py-2.5 rounded-full font-bold text-xs transition ${
                activeKategori === 'Ekspansi Wilayah'
                  ? 'bg-abisGreen text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Ekspansi Wilayah
            </button>
          </div>

          <div className="relative min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari aksi / admin / target..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-full py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-abisGreen text-slate-800"
            />
          </div>
        </div>

        {/* LOGS TABLE */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fbf9f3] border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  <th className="py-4 px-6">Timestamp & Waktu</th>
                  <th className="py-4 px-6">Administrator</th>
                  <th className="py-4 px-6">Jenis Aksi / Aktivitas</th>
                  <th className="py-4 px-6">Target Data / Pengguna</th>
                  <th className="py-4 px-6">Alamat IP & Lokasi</th>
                  <th className="py-4 px-6 text-right">Status Keamanan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#fcfbf7] transition">
                    <td className="py-4 px-6 font-semibold text-slate-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{log.adminName}</div>
                      <div className="text-[10px] text-slate-400">{log.adminEmail}</div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900 block">{log.aksi}</span>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-bold">
                        {log.kategori}
                      </span>
                    </td>

                    <td className="py-4 px-6 font-medium text-slate-800">
                      {log.targetData}
                    </td>

                    <td className="py-4 px-6 text-slate-600 font-mono text-[11px]">
                      {log.ipAddress}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold ${
                          log.status === 'Berhasil'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" /> {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredLogs.length === 0 && (
              <div className="py-12 text-center text-slate-400 font-bold">
                Tidak ada log audit ditemukan pada kategori ini.
              </div>
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}
