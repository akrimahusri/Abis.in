import React, { useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { ShieldCheck, FileText, Save, Check, History, Lock, AlertCircle, Eye, RefreshCw, CheckCircle2 } from 'lucide-react'

export default function KebijakanPrivasi() {
  const [version, setVersion] = useState('v1.2')
  const [effectiveDate, setEffectiveDate] = useState('16 Agustus 2026')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Policy text sections
  const [section1, setSection1] = useState(
    `1. Pengumpulan Data Pribadi Pengguna\nAbis.in mengumpulkan informasi yang Anda berikan secara langsung saat mendaftar akun sebagai Penjual, Pembeli, atau Peternak Maggot. Data ini meliputi nama lengkap/nama usaha, alamat email, nomor telepon, koordinat lokasi geografis (latitude & longitude), serta berkas dokumen pendukung (KTP/NIB) khusus untuk proses verifikasi mitra.`
  )

  const [section2, setSection2] = useState(
    `2. Keamanan & Enkripsi Data Sensitif\nSeluruh data identitas pribadi dan berkas verifikasi disimpan menggunakan teknologi enkripsi TLS/SSL dan proteksi keamanan database Supabase dengan sistem Row-Level Security (RLS). Akses staf administrator diproteksi oleh Autentikasi Dua-Faktor (2FA) dan dicatat dalam sistem Log Audit permanen.`
  )

  const [section3, setSection3] = useState(
    `3. Penggunaan Data Lokasi & Makanan Surplus\nKoordinat lokasi usaha digunakan secara ketat untuk menghitung jarak terdekat antara Penjual Makanan Surplus dengan Pembeli atau Peternak Maggot dalam radius operasi aktif. Data lokasi tidak akan diperjualbelikan atau dibagikan kepada pihak ketiga di luar alur transaksi platform.`
  )

  const [section4, setSection4] = useState(
    `4. Hak Pengguna & Penghapusan Data\nPengguna berhak mengajukan peninjauan, pembaruan, atau penghapusan permanen atas data pribadi mereka kapan saja melalui pengaturan profil atau dengan menghubungi Layanan Moderasi Administrator Abis.in.`
  )

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    setTimeout(() => {
      setIsSaving(false)
      showToast(`Kebijakan Privasi versi ${version} berhasil diperbarui & dipublikasikan!`)
    }, 800)
  }

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
              <ShieldCheck className="w-4 h-4" /> KEPATUHAN KEUANGAN & REGULASI PRIVASI (POIN 15%)
            </div>
            <h1 className="text-3xl font-literata font-bold text-abisGreen mt-1">Pengaturan Kebijakan Privasi</h1>
            <p className="text-sm text-slate-500 mt-1">
              Sunting dan publikasikan teks Kebijakan Privasi & Ketentuan Layanan resmi Abis.in yang tampil kepada seluruh pengguna.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> UU PDP & ISO 27001 Ready
            </span>
          </div>
        </div>

        {/* VERSION & METADATA CARD */}
        <div className="bg-[#123c2f] text-white p-6 rounded-3xl shadow-md border border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <span className="text-xs font-bold uppercase text-white/70">Versi Kebijakan Aktif</span>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-sm font-bold text-white outline-none focus:border-abisOrange w-28"
              />
              <span className="text-xs text-emerald-300 font-semibold">Publik & Terverifikasi</span>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold uppercase text-white/70">Tanggal Efektif Berlaku</span>
            <div className="mt-1">
              <input
                type="text"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-sm font-bold text-white outline-none focus:border-abisOrange w-full"
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={handleSavePolicy}
              disabled={isSaving}
              className="px-6 py-3 rounded-full bg-abisOrange text-white font-bold text-xs hover:bg-[#d67b22] transition shadow-md flex items-center gap-2 disabled:opacity-70"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Dipublikasikan Ke Pengguna
                </>
              )}
            </button>
          </div>
        </div>

        {/* POLICY EDITOR FORM */}
        <form onSubmit={handleSavePolicy} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h2 className="font-literata font-bold text-xl text-abisGreen border-b border-slate-100 pb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-abisOrange" /> Naskah Dokumen Kebijakan Privasi Platform
          </h2>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Pasal 1: Pengumpulan & Penggunaan Data Pribadi
              </label>
              <textarea
                rows={4}
                value={section1}
                onChange={(e) => setSection1(e.target.value)}
                className="w-full p-4 border border-slate-200 rounded-2xl outline-none focus:border-abisGreen bg-[#fbf9f3] text-xs leading-relaxed text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Pasal 2: Keamanan, Enkripsi, & Akses Administrator
              </label>
              <textarea
                rows={4}
                value={section2}
                onChange={(e) => setSection2(e.target.value)}
                className="w-full p-4 border border-slate-200 rounded-2xl outline-none focus:border-abisGreen bg-[#fbf9f3] text-xs leading-relaxed text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Pasal 3: Perlindungan Data Geografis & Lokasi Usaha
              </label>
              <textarea
                rows={4}
                value={section3}
                onChange={(e) => setSection3(e.target.value)}
                className="w-full p-4 border border-slate-200 rounded-2xl outline-none focus:border-abisGreen bg-[#fbf9f3] text-xs leading-relaxed text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Pasal 4: Hak Pengguna & Prosedur Penghapusan Data
              </label>
              <textarea
                rows={4}
                value={section4}
                onChange={(e) => setSection4(e.target.value)}
                className="w-full p-4 border border-slate-200 rounded-2xl outline-none focus:border-abisGreen bg-[#fbf9f3] text-xs leading-relaxed text-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              *Teks kebijakan ini akan otomatis diperbarui pada halaman Kebijakan Privasi di sisi Pengguna.
            </span>

            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-3 rounded-full bg-abisGreen text-white font-bold text-xs hover:bg-[#0e2718] transition shadow-md flex items-center gap-2 disabled:opacity-70"
            >
              <Save className="w-4 h-4" /> Simpan & Publikasikan Versi {version}
            </button>
          </div>
        </form>

      </div>
    </AdminLayout>
  )
}
