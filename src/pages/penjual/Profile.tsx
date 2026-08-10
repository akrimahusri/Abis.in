import React, { useState } from 'react'
import PenjualLayout from '../../layouts/PenjualLayout'
import { Clock3, Edit2, Mail, MapPin, MessageCircle, ShieldCheck, Star, Store, X } from 'lucide-react'

const initialOperationalHours = [
  { day: 'Senin', buka: '08:00', tutup: '20:00', pickup: '19:00 - 20:30' },
  { day: 'Selasa', buka: '08:00', tutup: '20:00', pickup: '19:00 - 20:30' },
  { day: 'Rabu', buka: '08:00', tutup: '20:00', pickup: '19:00 - 20:30' },
  { day: 'Kamis', buka: '08:00', tutup: '20:00', pickup: '19:00 - 20:30' },
  { day: 'Jumat', buka: '08:00', tutup: '20:00', pickup: '19:00 - 20:30' },
  { day: 'Sabtu', buka: '08:00', tutup: '20:00', pickup: '19:00 - 20:30' },
  { day: 'Minggu', buka: 'Libur', tutup: '', pickup: 'Libur' },
]

const initialProfile = {
  businessName: 'Warteg Bahagia',
  category: 'Rumah Makan',
  address: 'Jl. Sultan Iskandar Muda, Gp Lambung, Like-Heu, Banda Aceh',
  whatsapp: '+62 812-3456-7890',
  email: 'kontak@wartegbahagia.com',
  operationalHours: initialOperationalHours,
}

export default function PenjualProfile() {
  const [profile, setProfile] = useState(initialProfile)
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const mapStyle = {
    backgroundImage:
      'linear-gradient(125deg, transparent 0 25%, rgba(90,110,91,0.08) 25% 27%, transparent 27% 42%, rgba(90,110,91,0.08) 42% 44%, transparent 44% 100%), linear-gradient(42deg, transparent 0 32%, rgba(90,110,91,0.08) 32% 34%, transparent 34% 58%, rgba(90,110,91,0.08) 58% 60%, transparent 60% 100%), linear-gradient(180deg, rgba(255,255,255,0.42), rgba(255,255,255,0.42)), radial-gradient(circle at 20% 20%, rgba(255,255,255,0.75), transparent 18%), radial-gradient(circle at 78% 26%, rgba(255,255,255,0.6), transparent 22%)',
    backgroundColor: '#edf1ea',
  }

  const updateProfileField = (field: keyof typeof initialProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const updateOperationalHour = (day: string, field: 'buka' | 'tutup' | 'pickup', value: string) => {
    setProfile((prev) => ({
      ...prev,
      operationalHours: prev.operationalHours.map((item) =>
        item.day === day ? { ...item, [field]: value } : item,
      ),
    }))
  }

  const handleEditProfile = () => {
    setIsEditing(true)
  }

  const handleSaveProfile = (event: React.FormEvent) => {
    event.preventDefault()
    setIsEditing(false)
  }

  const handlePasswordSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Konfirmasi kata sandi baru tidak cocok.')
      return
    }
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
    setShowPasswordModal(false)
  }

  const handleWhatsApp = () => {
    window.open('https://wa.me/6281234567890', '_blank', 'noopener,noreferrer')
  }

  const handleEmail = () => {
    window.location.href = 'mailto:kontak@wartegbahagia.com'
  }

  return (
    <PenjualLayout>
      <div className="pb-6 pt-5">
        <header className="mb-6 flex flex-col gap-4 rounded-[1.4rem] bg-[#f7f5ef] px-4 py-4 shadow-[0_1px_0_rgba(29,54,42,0.04)] sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-5">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 overflow-hidden rounded-full border-[3px] border-[#1b4332] bg-[#1b4332] shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=300&q=80"
                alt="Warteg Bahagia"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-literata text-[1.6rem] font-bold leading-none text-[#1b4332] sm:text-[2.05rem]">{profile.businessName}</h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#1b4332] bg-[#e7efe9] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#1b4332]">
                  <ShieldCheck className="h-3 w-3" />
                  Mitra Verifikasi
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#3b4b42] sm:text-sm">
                <div className="flex items-center gap-1 text-[#1b4332]">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-bold">4.8/5.0</span>
                </div>
                <span>(240 Ulasan)</span>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1 text-[#1b4332]">
                  <MapPin className="h-4 w-4" />
                  <span>Banda Aceh</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleEditProfile}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#1b4332] bg-white px-5 py-3 text-sm font-semibold text-[#1b4332] shadow-sm transition hover:bg-[#1b4332] hover:text-white"
          >
            <Edit2 className="h-4 w-4" />
            Edit Profile
          </button>
        </header>

        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-6 rounded-[1.6rem] border border-[#d9dcd2] bg-[#f7f7f1] p-5 shadow-[0_1px_0_rgba(29,54,42,0.04)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-[1.05rem] font-bold text-[#1b4332]">
                <Edit2 className="h-5 w-5" />
                Edit Profile
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-600"
              >
                Batalkan
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-[#1b4332]">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#4f5f57]">Nama Usaha</span>
                <input
                  value={profile.businessName}
                  onChange={(event) => updateProfileField('businessName', event.target.value)}
                  className="w-full rounded-xl border border-[#dfe3dc] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#1b4332]"
                />
              </label>

              <label className="block text-sm text-[#1b4332]">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#4f5f57]">Kategori</span>
                <input
                  value={profile.category}
                  onChange={(event) => updateProfileField('category', event.target.value)}
                  className="w-full rounded-xl border border-[#dfe3dc] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#1b4332]"
                />
              </label>
            </div>

            <label className="block text-sm text-[#1b4332]">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#4f5f57]">Alamat Usaha</span>
              <textarea
                value={profile.address}
                onChange={(event) => updateProfileField('address', event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-[#dfe3dc] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#1b4332]"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-[#1b4332]">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#4f5f57]">WhatsApp</span>
                <input
                  value={profile.whatsapp}
                  onChange={(event) => updateProfileField('whatsapp', event.target.value)}
                  className="w-full rounded-xl border border-[#dfe3dc] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#1b4332]"
                />
              </label>

              <label className="block text-sm text-[#1b4332]">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#4f5f57]">Email Bisnis</span>
                <input
                  value={profile.email}
                  onChange={(event) => updateProfileField('email', event.target.value)}
                  className="w-full rounded-xl border border-[#dfe3dc] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#1b4332]"
                />
              </label>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[#4f5f57]">Jam Operasional</h3>
              <div className="space-y-2">
                {profile.operationalHours.map((item) => (
                  <div key={item.day} className="grid gap-2 rounded-xl border border-[#dfe3dc] bg-white p-3 md:grid-cols-[1.2fr_1fr_1fr]">
                    <div className="flex items-center text-sm font-semibold text-[#1b4332]">{item.day}</div>
                    <input
                      type="text"
                      value={item.buka === 'Libur' ? 'Libur' : item.buka}
                      onChange={(event) => updateOperationalHour(item.day, 'buka', event.target.value)}
                      className="rounded-lg border border-[#dfe3dc] px-3 py-2 text-sm outline-none transition focus:border-[#1b4332]"
                    />
                    <input
                      type="text"
                      value={item.tutup}
                      onChange={(event) => updateOperationalHour(item.day, 'tutup', event.target.value)}
                      className="rounded-lg border border-[#dfe3dc] px-3 py-2 text-sm outline-none transition focus:border-[#1b4332]"
                      disabled={item.buka === 'Libur'}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-600"
              >
                Batalkan
              </button>
              <button
                type="submit"
                className="rounded-full bg-[#1b4332] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#14342a]"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.75fr_0.9fr]">
            <section className="rounded-[1.6rem] border border-[#d9dcd2] bg-[#f7f7f1] p-5 shadow-[0_1px_0_rgba(29,54,42,0.04)]">
              <div className="mb-5 flex items-center gap-3 text-[1.05rem] font-bold text-[#1b4332]">
                <Store className="h-5 w-5" />
                Informasi Bisnis
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#4f5f57]">Nama Usaha</label>
                  <div className="rounded-xl border border-[#dfe3dc] bg-white px-3 py-3 text-sm text-[#1b4332] shadow-sm">{profile.businessName}</div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#4f5f57]">Kategori</label>
                  <div className="rounded-xl border border-[#dfe3dc] bg-white px-3 py-3 text-sm text-[#1b4332] shadow-sm">{profile.category}</div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#4f5f57]">Alamat Usaha</label>
                <div className="rounded-xl border border-[#dfe3dc] bg-white px-3 py-3 text-sm text-[#1b4332] shadow-sm">
                  {profile.address}
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-[1.2rem] border border-[#dbe0d6] bg-[#edf0ea] shadow-inner">
                <div className="relative h-[14.5rem] w-full" style={mapStyle}>
                  <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-[#d45353] shadow-[0_0_0_5px_rgba(212,83,83,0.12)]" />
                  <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d45353]/30 bg-[#d45353]/10" />
                </div>
              </div>
            </section>

            <div className="space-y-6">
              <section className="rounded-[1.6rem] border border-[#d9dcd2] bg-[#f7f7f1] p-5 shadow-[0_1px_0_rgba(29,54,42,0.04)]">
                <div className="mb-5 flex items-center gap-3 text-[1.05rem] font-bold text-[#1b4332]">
                  <Clock3 className="h-5 w-5" />
                  Jam Operasional
                </div>

                <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-2 rounded-xl border border-[#dfe3dc] bg-white p-2 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-[#4f5f57] shadow-sm">
                  <div className="py-2 text-left pl-3">Hari</div>
                  <div className="py-2">Buka - Tutup</div>
                  <div className="py-2">Pickup Surplus</div>
                </div>

                <div className="mt-2 space-y-2">
                  {profile.operationalHours.map((item) => (
                    <div key={item.day} className="grid grid-cols-[1.2fr_1fr_1fr] gap-2 rounded-xl border border-[#dfe3dc] bg-white px-3 py-2 text-[13px] text-[#1b4332] shadow-sm">
                      <div className="flex items-center font-semibold">{item.day}</div>
                      <div className="text-center">
                        {item.buka === 'Libur' ? (
                          <span className="text-[#586b5d]">Libur</span>
                        ) : (
                          <span>{item.buka} - {item.tutup}</span>
                        )}
                      </div>
                      <div className="text-center">
                        {item.pickup === 'Libur' ? (
                          <span className="text-[#586b5d]">Libur</span>
                        ) : (
                          <span className="text-[#d13a3a] font-semibold">{item.pickup}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[1.6rem] border border-[#d9dcd2] bg-[#f7f7f1] p-5 shadow-[0_1px_0_rgba(29,54,42,0.04)]">
                <div className="mb-5 flex items-center gap-3 text-[1.05rem] font-bold text-[#1b4332]">
                  <ShieldCheck className="h-5 w-5" />
                  Kontak & Keamanan
                </div>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#dfe3dc] bg-white px-4 py-3 text-left shadow-sm transition hover:border-[#1b4332]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dff3e8] text-[#1b4332]">
                        <MessageCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1b4332]">WhatsApp</p>
                        <p className="text-sm text-[#4f5f57]">{profile.whatsapp}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-[#dff3e8] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#1b4332]">
                      Terhubung
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleEmail}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#dfe3dc] bg-white px-4 py-3 text-left shadow-sm transition hover:border-[#1b4332]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dfeaf5] text-[#1b4332]">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1b4332]">Email Bisnis</p>
                        <p className="text-sm text-[#4f5f57]">{profile.email}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-[#dfeaf5] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#1b4332]">
                      Aktif
                    </span>
                  </button>

                  <div className="pt-1">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#4f5f57]">Keamanan Akun</label>
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(true)}
                      className="w-full rounded-xl border border-[#dfe3dc] bg-white px-4 py-3 text-left text-sm text-[#4f5f57] shadow-sm transition hover:border-[#1b4332] hover:text-[#1b4332]"
                    >
                      Ubah Kata Sandi
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a332c]/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.4rem] bg-[#f8f7f3] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1b4332]">Ubah Kata Sandi</h2>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 hover:border-[#1b4332] hover:text-[#1b4332]"
                aria-label="Tutup modal password"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <label className="block text-sm text-[#1b4332]">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#4f5f57]">Kata Sandi Lama</span>
                <input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, oldPassword: event.target.value }))}
                  className="w-full rounded-xl border border-[#dfe3dc] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#1b4332]"
                />
              </label>

              <label className="block text-sm text-[#1b4332]">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#4f5f57]">Kata Sandi Baru</span>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                  className="w-full rounded-xl border border-[#dfe3dc] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#1b4332]"
                />
              </label>

              <label className="block text-sm text-[#1b4332]">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#4f5f57]">Konfirmasi Kata Sandi Baru</span>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  className="w-full rounded-xl border border-[#dfe3dc] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#1b4332]"
                />
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 rounded-full bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-600"
                >
                  Batalkan
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
                >
                  Ganti Kata Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PenjualLayout>
  )
}
