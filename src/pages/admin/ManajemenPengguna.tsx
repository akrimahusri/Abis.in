import React, { useEffect, useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { Users, Store, ShoppingBag, Bug, ShieldCheck, Search, Filter, Eye, UserX, CheckCircle2, AlertCircle, Mail, MapPin, Phone, Calendar, X, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'

type ProfileItem = {
  id: string
  email: string
  name: string
  role: 'penjual' | 'pembeli' | 'peternak' | 'admin' | string
  nama_usaha?: string | null
  status_verifikasi: string
  status_akun: 'aktif' | 'disuspend' | string
  created_at: string
  no_hp?: string
  lokasi?: string
}

const mockProfiles: ProfileItem[] = [
  {
    id: 'usr-1',
    name: 'Budi Santoso',
    email: 'budi.santoso@gmail.com',
    role: 'penjual',
    nama_usaha: 'Warung Makan Nasi Gurih Budi',
    status_verifikasi: 'verified',
    status_akun: 'aktif',
    created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    no_hp: '+62 812-3456-7890',
    lokasi: 'Kuta Alam, Banda Aceh',
  },
  {
    id: 'usr-2',
    name: 'Siti Rahmah',
    email: 'siti.rahmah@gmail.com',
    role: 'pembeli',
    nama_usaha: null,
    status_verifikasi: 'verified',
    status_akun: 'aktif',
    created_at: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
    no_hp: '+62 852-9876-5432',
    lokasi: 'Syiah Kuala, Banda Aceh',
  },
  {
    id: 'usr-3',
    name: 'Teuku Maggot Farm',
    email: 'teuku.maggot@gmail.com',
    role: 'peternak',
    nama_usaha: 'Teuku Maggot Bio Center',
    status_verifikasi: 'pending',
    status_akun: 'aktif',
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    no_hp: '+62 813-5544-3322',
    lokasi: 'Darussalam, Aceh Besar',
  },
  {
    id: 'usr-4',
    name: 'Resto Seafood Lamnyong',
    email: 'seafood.lamnyong@gmail.com',
    role: 'penjual',
    nama_usaha: 'Resto Seafood Lamnyong',
    status_verifikasi: 'verified',
    status_akun: 'disuspend',
    created_at: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
    no_hp: '+62 811-2233-4455',
    lokasi: 'Lamnyong, Banda Aceh',
  },
]

export default function ManajemenPengguna() {
  const [profiles, setProfiles] = useState<ProfileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeRoleFilter, setActiveRoleFilter] = useState<string>('semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Profile Detail Modal
  const [selectedUser, setSelectedUser] = useState<ProfileItem | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Fetch users from Supabase 'profiles'
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data: dbProfiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && dbProfiles && dbProfiles.length > 0) {
        const mapped: ProfileItem[] = dbProfiles.map((p, idx) => ({
          id: p.id,
          name: p.name || p.nama_usaha || `Pengguna #${idx + 1}`,
          email: p.email || 'tanpa.email@abis.in',
          role: p.role || 'pembeli',
          nama_usaha: p.nama_usaha || null,
          status_verifikasi: p.status_verifikasi || 'verified',
          status_akun: p.status_akun || 'aktif',
          created_at: p.created_at || new Date().toISOString(),
          no_hp: p.telepon || '+62 812-0000-1111',
          lokasi: p.alamat || 'Banda Aceh',
        }))

        // Combine with mock if items are few
        const combined = [...mapped]
        mockProfiles.forEach((mock) => {
          if (!combined.some((item) => item.id === mock.id)) {
            combined.push(mock)
          }
        })
        setProfiles(combined)
      } else {
        setProfiles(mockProfiles)
      }
    } catch (err) {
      setProfiles(mockProfiles)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Toggle Suspend / Active User Status
  const toggleUserSuspendStatus = async (user: ProfileItem) => {
    const nextStatus = user.status_akun === 'disuspend' ? 'aktif' : 'disuspend'

    try {
      if (!user.id.startsWith('usr-')) {
        await supabase
          .from('profiles')
          .update({ status_akun: nextStatus })
          .eq('id', user.id)
      }

      setProfiles((prev) =>
        prev.map((p) => (p.id === user.id ? { ...p, status_akun: nextStatus } : p))
      )
      if (selectedUser?.id === user.id) {
        setSelectedUser((prev) => (prev ? { ...prev, status_akun: nextStatus } : null))
      }

      showToast(`Status akun "${user.name}" diubah menjadi ${nextStatus.toUpperCase()}.`)
    } catch (err) {
      showToast('Gagal memperbarui status akun.')
    }
  }

  // Filtered List
  const filteredUsers = profiles.filter((p) => {
    const matchesRole = activeRoleFilter === 'semua' ? true : p.role === activeRoleFilter
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nama_usaha && p.nama_usaha.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesRole && matchesSearch
  })

  // Role Counts
  const totalCount = profiles.length
  const penjualCount = profiles.filter((p) => p.role === 'penjual').length
  const pembeliCount = profiles.filter((p) => p.role === 'pembeli').length
  const peternakCount = profiles.filter((p) => p.role === 'peternak').length

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
              <Users className="w-4 h-4" /> DIREKTORI ANGGOTA & ROLE-BASED ACCESS
            </div>
            <h1 className="text-3xl font-literata font-bold text-abisGreen mt-1">Manajemen Pengguna</h1>
            <p className="text-sm text-slate-500 mt-1">
              Kelola seluruh basis akun pengguna platform per peran (Penjual, Pembeli, Peternak, Admin).
            </p>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, email, atau usaha..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#fbf9f3] border border-slate-200 rounded-full py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-abisGreen text-slate-800"
            />
          </div>
        </div>

        {/* ROLE FILTER TABS */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveRoleFilter('semua')}
              className={`px-5 py-2.5 rounded-full font-bold text-xs transition ${
                activeRoleFilter === 'semua'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Semua Role ({totalCount})
            </button>

            <button
              onClick={() => setActiveRoleFilter('penjual')}
              className={`px-5 py-2.5 rounded-full font-bold text-xs transition flex items-center gap-2 ${
                activeRoleFilter === 'penjual'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Penjual Makanan ({penjualCount})</span>
            </button>

            <button
              onClick={() => setActiveRoleFilter('pembeli')}
              className={`px-5 py-2.5 rounded-full font-bold text-xs transition flex items-center gap-2 ${
                activeRoleFilter === 'pembeli'
                  ? 'bg-abisOrange text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Pembeli ({pembeliCount})</span>
            </button>

            <button
              onClick={() => setActiveRoleFilter('peternak')}
              className={`px-5 py-2.5 rounded-full font-bold text-xs transition flex items-center gap-2 ${
                activeRoleFilter === 'peternak'
                  ? 'bg-abisGreen text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Peternak Maggot ({peternakCount})</span>
            </button>
          </div>
        </div>

        {/* USERS TABLE */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-bold animate-pulse">
              Memuat data pengguna...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fbf9f3] border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                    <th className="py-4 px-6">Pengguna</th>
                    <th className="py-4 px-6">Peran (Role)</th>
                    <th className="py-4 px-6">Kontak & Lokasi</th>
                    <th className="py-4 px-6">Status Verifikasi</th>
                    <th className="py-4 px-6">Status Akun</th>
                    <th className="py-4 px-6 text-right">Tindakan Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredUsers.map((user) => {
                    const isPenjual = user.role === 'penjual'
                    const isPeternak = user.role === 'peternak'
                    const isPembeli = user.role === 'pembeli'

                    return (
                      <tr key={user.id} className="hover:bg-[#fcfbf7] transition">
                        <td className="py-4 px-6 font-semibold text-slate-900">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-abisGreen text-white font-bold flex items-center justify-center text-sm shrink-0">
                              {user.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                              <p className="text-[11px] text-slate-400 font-normal">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isPenjual
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : isPeternak
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                : isPembeli
                                ? 'bg-orange-100 text-orange-900 border border-orange-200'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {isPenjual && <Store className="w-3.5 h-3.5" />}
                            {isPeternak && <Bug className="w-3.5 h-3.5" />}
                            {isPembeli && <ShoppingBag className="w-3.5 h-3.5" />}
                            {user.role}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-slate-600 space-y-0.5">
                          <p className="flex items-center gap-1 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" /> {user.no_hp}
                          </p>
                          <p className="flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3 h-3 text-slate-400" /> {user.lokasi}
                          </p>
                        </td>

                        <td className="py-4 px-6">
                          {user.status_verifikasi === 'verified' ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 flex items-center gap-1 w-fit">
                              <AlertCircle className="w-3.5 h-3.5" /> Pending
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          {user.status_akun === 'disuspend' ? (
                            <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-[10px] font-bold border border-red-300 w-fit block">
                              Disuspend
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 w-fit block">
                              Aktif Normal
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                            title="Lihat Detail Profil"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => toggleUserSuspendStatus(user)}
                            className={`p-2 rounded-xl transition ${
                              user.status_akun === 'disuspend'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                            title={user.status_akun === 'disuspend' ? 'Aktifkan Akun Kembali' : 'Suspend Akun Ini'}
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="py-12 text-center text-slate-400">
                  <p className="font-bold text-sm">Tidak ada pengguna ditemukan</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* USER DETAIL MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-abisGreen text-white font-bold text-lg flex items-center justify-center">
                  {selectedUser.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-literata font-bold text-xl text-slate-900">{selectedUser.name}</h3>
                  <span className="text-xs text-slate-400">{selectedUser.email}</span>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* DETAIL FIELDS */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-[#fbf9f3] p-3 rounded-2xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-400 uppercase text-[10px]">ID Pengguna</span>
                <p className="font-semibold text-slate-800 break-all">{selectedUser.id}</p>
              </div>

              <div className="bg-[#fbf9f3] p-3 rounded-2xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Peran (Role)</span>
                <p className="font-bold text-abisGreen uppercase">{selectedUser.role}</p>
              </div>

              <div className="bg-[#fbf9f3] p-3 rounded-2xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Nama Usaha</span>
                <p className="font-semibold text-slate-800">{selectedUser.nama_usaha || '-'}</p>
              </div>

              <div className="bg-[#fbf9f3] p-3 rounded-2xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Nomor Telepon</span>
                <p className="font-semibold text-slate-800">{selectedUser.no_hp || '-'}</p>
              </div>

              <div className="col-span-2 bg-[#fbf9f3] p-3 rounded-2xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Lokasi Usaha / Tempat</span>
                <p className="font-semibold text-slate-800">{selectedUser.lokasi || '-'}</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <button
                onClick={() => toggleUserSuspendStatus(selectedUser)}
                className={`px-5 py-2.5 rounded-full font-bold text-xs transition ${
                  selectedUser.status_akun === 'disuspend'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {selectedUser.status_akun === 'disuspend' ? 'Aktifkan Akun' : 'Suspend Akun Ini'}
              </button>

              <button
                onClick={() => setSelectedUser(null)}
                className="px-6 py-2.5 rounded-full bg-slate-800 text-white font-bold text-xs hover:bg-slate-900"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
