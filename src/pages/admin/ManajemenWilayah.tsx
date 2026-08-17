import React, { useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { MapPin, Plus, Check, Power, Store, Bug, Search, ChevronRight, AlertCircle, Globe, Navigation, Building2 } from 'lucide-react'

type District = {
  id: string
  name: string
  active: boolean
  penjualCount: number
  peternakCount: number
}

type City = {
  id: string
  name: string
  active: boolean
  districts: District[]
}

type Province = {
  id: string
  name: string
  active: boolean
  cities: City[]
}

const initialProvinces: Province[] = [
  {
    id: 'prov-1',
    name: 'Aceh',
    active: true,
    cities: [
      {
        id: 'city-1',
        name: 'Kota Banda Aceh',
        active: true,
        districts: [
          { id: 'dist-1', name: 'Kuta Alam', active: true, penjualCount: 14, peternakCount: 4 },
          { id: 'dist-2', name: 'Syiah Kuala', active: true, penjualCount: 18, peternakCount: 6 },
          { id: 'dist-3', name: 'Baiturrahman', active: true, penjualCount: 12, peternakCount: 3 },
          { id: 'dist-4', name: 'Meuraxa', active: true, penjualCount: 9, peternakCount: 2 },
          { id: 'dist-5', name: 'Ulee Kareng', active: false, penjualCount: 0, peternakCount: 0 },
          { id: 'dist-6', name: 'Banda Raya', active: false, penjualCount: 0, peternakCount: 0 },
        ],
      },
      {
        id: 'city-2',
        name: 'Kabupaten Aceh Besar',
        active: true,
        districts: [
          { id: 'dist-7', name: 'Darussalam (Tungkop)', active: true, penjualCount: 8, peternakCount: 7 },
          { id: 'dist-8', name: 'Ingin Jaya', active: true, penjualCount: 6, peternakCount: 5 },
          { id: 'dist-9', name: 'Kuta Baro', active: false, penjualCount: 0, peternakCount: 0 },
          { id: 'dist-10', name: 'Montasik', active: false, penjualCount: 0, peternakCount: 0 },
        ],
      },
      {
        id: 'city-3',
        name: 'Kota Lhokseumawe',
        active: false,
        districts: [
          { id: 'dist-11', name: 'Banda Sakti', active: false, penjualCount: 0, peternakCount: 0 },
          { id: 'dist-12', name: 'Muara Dua', active: false, penjualCount: 0, peternakCount: 0 },
        ],
      },
    ],
  },
  {
    id: 'prov-2',
    name: 'Sumatera Utara',
    active: false,
    cities: [
      {
        id: 'city-4',
        name: 'Kota Medan',
        active: false,
        districts: [
          { id: 'dist-13', name: 'Medan Baru', active: false, penjualCount: 0, peternakCount: 0 },
          { id: 'dist-14', name: 'Medan Selayang', active: false, penjualCount: 0, peternakCount: 0 },
        ],
      },
    ],
  },
  {
    id: 'prov-3',
    name: 'DKI Jakarta',
    active: false,
    cities: [
      {
        id: 'city-5',
        name: 'Jakarta Selatan',
        active: false,
        districts: [
          { id: 'dist-15', name: 'Kebayoran Baru', active: false, penjualCount: 0, peternakCount: 0 },
          { id: 'dist-16', name: 'Tebet', active: false, penjualCount: 0, peternakCount: 0 },
        ],
      },
    ],
  },
]

export default function ManajemenWilayah() {
  const [provinces, setProvinces] = useState<Province[]>(initialProvinces)
  const [selectedProvId, setSelectedProvId] = useState<string>('prov-1')
  const [selectedCityId, setSelectedCityId] = useState<string>('city-1')
  const [searchQuery, setSearchQuery] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Add New Region Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newProvName, setNewProvName] = useState('Aceh')
  const [newCityName, setNewCityName] = useState('')
  const [newDistrictName, setNewDistrictName] = useState('')

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const selectedProvince = provinces.find((p) => p.id === selectedProvId) || provinces[0]
  const selectedCity = selectedProvince?.cities.find((c) => c.id === selectedCityId) || selectedProvince?.cities[0]

  // Toggle Province Status
  const toggleProvinceStatus = (provId: string) => {
    setProvinces((prev) =>
      prev.map((p) => {
        if (p.id === provId) {
          const nextActive = !p.active
          showToast(`Provinsi "${p.name}" sekarang ${nextActive ? 'Aktif' : 'Non-aktif'}.`)
          return {
            ...p,
            active: nextActive,
            cities: p.cities.map((c) => ({
              ...c,
              active: nextActive,
              districts: c.districts.map((d) => ({ ...d, active: nextActive })),
            })),
          }
        }
        return p
      })
    )
  }

  // Toggle City Status
  const toggleCityStatus = (cityId: string) => {
    setProvinces((prev) =>
      prev.map((p) => ({
        ...p,
        cities: p.cities.map((c) => {
          if (c.id === cityId) {
            const nextActive = !c.active
            showToast(`Kota "${c.name}" sekarang ${nextActive ? 'Aktif' : 'Non-aktif'}.`)
            return {
              ...c,
              active: nextActive,
              districts: c.districts.map((d) => ({ ...d, active: nextActive })),
            }
          }
          return c
        }),
      }))
    )
  }

  // Toggle District Status
  const toggleDistrictStatus = (districtId: string) => {
    setProvinces((prev) =>
      prev.map((p) => ({
        ...p,
        cities: p.cities.map((c) => ({
          ...c,
          districts: c.districts.map((d) => {
            if (d.id === districtId) {
              const nextActive = !d.active
              showToast(`Kecamatan "${d.name}" sekarang ${nextActive ? 'Aktif' : 'Non-aktif'}.`)
              return { ...d, active: nextActive }
            }
            return d
          }),
        })),
      }))
    )
  }

  // Add District / City
  const handleAddRegion = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDistrictName.trim()) return

    const newDist: District = {
      id: `dist-${Date.now()}`,
      name: newDistrictName.trim(),
      active: true,
      penjualCount: 0,
      peternakCount: 0,
    }

    setProvinces((prev) =>
      prev.map((p) => {
        if (p.name.toLowerCase() === newProvName.toLowerCase() || p.id === selectedProvId) {
          return {
            ...p,
            active: true,
            cities: p.cities.map((c) => {
              if (c.id === selectedCityId || c.name.toLowerCase() === newCityName.toLowerCase()) {
                return {
                  ...c,
                  active: true,
                  districts: [...c.districts, newDist],
                }
              }
              return c
            }),
          }
        }
        return p
      })
    )

    showToast(`Wilayah baru "${newDistrictName}" berhasil ditambahkan & diaktifkan!`)
    setNewDistrictName('')
    setShowAddModal(false)
  }

  // Calculate Metrics
  const activeProvincesCount = provinces.filter((p) => p.active).length
  const activeCitiesCount = provinces.flatMap((p) => p.cities).filter((c) => c.active).length
  const activeDistrictsCount = provinces.flatMap((p) => p.cities).flatMap((c) => c.districts).filter((d) => d.active).length
  const totalPenjual = provinces.flatMap((p) => p.cities).flatMap((c) => c.districts).reduce((acc, d) => acc + d.penjualCount, 0)
  const totalPeternak = provinces.flatMap((p) => p.cities).flatMap((c) => c.districts).reduce((acc, d) => acc + d.peternakCount, 0)

  const filteredDistricts = (selectedCity?.districts || []).filter((d) =>
    searchQuery === '' ? true : d.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
              <Globe className="w-4 h-4" /> EKSPANSI WILAYAH OPERASIONAL PLATFORM
            </div>
            <h1 className="text-3xl font-literata font-bold text-abisGreen mt-1">Manajemen Wilayah</h1>
            <p className="text-sm text-slate-500 mt-1">
              Atur hirarki Provinsi → Kota → Kecamatan dan aktifkan wilayah operasi baru secara bertahap.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 rounded-full bg-abisGreen text-white font-bold text-xs hover:bg-[#0e2718] transition shadow-sm flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> Aktifkan Wilayah Baru
          </button>
        </div>

        {/* METRICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Provinsi Aktif</span>
              <Globe className="w-5 h-5 text-abisGreen" />
            </div>
            <p className="text-3xl font-bold font-literata text-abisGreen">
              {activeProvincesCount} <span className="text-xs font-normal text-slate-400">/ {provinces.length} Provinsi</span>
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Kota / Kabupaten</span>
              <Building2 className="w-5 h-5 text-abisOrange" />
            </div>
            <p className="text-3xl font-bold font-literata text-slate-900">
              {activeCitiesCount} <span className="text-xs font-normal text-slate-400">Kota Operasional</span>
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Kecamatan Aktif</span>
              <Navigation className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-bold font-literata text-emerald-700">
              {activeDistrictsCount} <span className="text-xs font-normal text-slate-400">Kecamatan</span>
            </p>
          </div>

          <div className="bg-[#123c2f] text-white p-5 rounded-3xl shadow-sm space-y-2">
            <div className="flex items-center justify-between text-white/70">
              <span className="text-xs font-bold uppercase tracking-wider">Mitra Terjangkau</span>
              <Store className="w-5 h-5 text-abisOrange" />
            </div>
            <p className="text-3xl font-bold font-literata text-white">
              {totalPenjual + totalPeternak} <span className="text-xs font-normal text-emerald-300">Mitra Aktif</span>
            </p>
          </div>
        </div>

        {/* MAIN LAYOUT: HIERARCHY NAVIGATION & DISTRICT LIST */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT PANEL: PROVINCE & CITY SELECTOR */}
          <div className="lg:col-span-4 space-y-6">

            {/* PROVINCE PICKER */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <h3 className="font-literata font-bold text-lg text-abisGreen border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>1. Pilih Provinsi</span>
                <span className="text-xs font-semibold text-slate-400">{provinces.length} Daerah</span>
              </h3>

              <div className="space-y-2">
                {provinces.map((prov) => {
                  const isSelected = prov.id === selectedProvId
                  return (
                    <div
                      key={prov.id}
                      onClick={() => {
                        setSelectedProvId(prov.id)
                        setSelectedCityId(prov.cities[0]?.id || '')
                      }}
                      className={`p-3.5 rounded-2xl cursor-pointer border transition flex items-center justify-between ${isSelected
                          ? 'bg-[#123c2f] text-white border-[#123c2f] shadow-md'
                          : 'bg-[#fbf9f3] text-slate-800 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className={`w-4 h-4 ${isSelected ? 'text-abisOrange' : 'text-slate-400'}`} />
                        <span className="font-bold text-sm">{prov.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleProvinceStatus(prov.id)
                          }}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition ${prov.active
                              ? isSelected
                                ? 'bg-emerald-500 text-white'
                                : 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                            }`}
                        >
                          {prov.active ? 'Aktif' : 'Non-aktif'}
                        </button>
                        <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* CITY PICKER */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <h3 className="font-literata font-bold text-lg text-abisGreen border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>2. Pilih Kota / Kabupaten</span>
                <span className="text-xs font-semibold text-slate-400">{selectedProvince.cities.length} Kota</span>
              </h3>

              <div className="space-y-2">
                {selectedProvince.cities.map((city) => {
                  const isSelected = city.id === selectedCityId
                  return (
                    <div
                      key={city.id}
                      onClick={() => setSelectedCityId(city.id)}
                      className={`p-3.5 rounded-2xl cursor-pointer border transition flex items-center justify-between ${isSelected
                          ? 'bg-abisOrange text-white border-abisOrange shadow-md'
                          : 'bg-[#fbf9f3] text-slate-800 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                        <span className="font-bold text-sm">{city.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleCityStatus(city.id)
                          }}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition ${city.active
                              ? isSelected
                                ? 'bg-slate-900 text-white'
                                : 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                            }`}
                        >
                          {city.active ? 'Aktif' : 'Non-aktif'}
                        </button>
                        <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: DISTRICT MANAGEMENT & TOGGLE EXPANSION */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-abisOrange uppercase">
                    <Navigation className="w-4 h-4" /> 3. Kelola Kecamatan Operasional
                  </div>
                  <h2 className="font-literata font-bold text-2xl text-abisGreen mt-1">
                    {selectedCity?.name || 'Pilih Kota'}, {selectedProvince.name}
                  </h2>
                </div>

                {/* SEARCH DISTRICT */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari kecamatan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#fbf9f3] border border-slate-200 rounded-full py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-abisGreen text-slate-800"
                  />
                </div>
              </div>

              {/* LIST OF DISTRICTS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredDistricts.map((district) => (
                  <div
                    key={district.id}
                    className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-4 ${district.active
                        ? 'bg-white border-emerald-200 shadow-sm'
                        : 'bg-[#faf9f5] border-slate-200 opacity-80'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-base text-slate-900">{district.name}</h4>
                        <span className="text-[10px] text-slate-400">Kecamatan Operasional</span>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${district.active
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-200 text-slate-600'
                          }`}
                      >
                        {district.active ? 'Beroperasi' : 'Belum Aktif'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#f8f6f0] p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                        <Store className="w-3.5 h-3.5 text-amber-600" />
                        <span>{district.penjualCount} Penjual</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                        <Bug className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{district.peternakCount} Peternak</span>
                      </div>
                    </div>

                    {/* TOGGLE EXPANSION BUTTON */}
                    <button
                      onClick={() => toggleDistrictStatus(district.id)}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${district.active
                          ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                          : 'bg-abisGreen text-white hover:bg-[#0e2718] shadow-sm'
                        }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      {district.active ? 'Non-aktifkan Wilayah Ini' : 'Aktifkan Layanan di Kecamatan Ini'}
                    </button>
                  </div>
                ))}
              </div>

              {filteredDistricts.length === 0 && (
                <div className="py-12 text-center bg-[#fbf9f3] rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-bold text-sm text-slate-700">Tidak ada kecamatan ditemukan</p>
                  <p className="text-xs text-slate-400">Klik tombol "Aktifkan Wilayah Baru" untuk menambahkan kecamatan operasional baru.</p>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

      {/* ADD NEW REGION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-literata font-bold text-lg text-abisGreen">Tambah Wilayah Operasi Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRegion} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Nama Provinsi</label>
                <input
                  type="text"
                  value={newProvName}
                  onChange={(e) => setNewProvName(e.target.value)}
                  placeholder="Misal: Aceh / Sumatera Utara"
                  required
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-abisGreen bg-[#fbf9f3]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Nama Kota / Kabupaten</label>
                <input
                  type="text"
                  value={newCityName || selectedCity?.name}
                  onChange={(e) => setNewCityName(e.target.value)}
                  placeholder="Misal: Kota Banda Aceh"
                  required
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-abisGreen bg-[#fbf9f3]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Nama Kecamatan Baru</label>
                <input
                  type="text"
                  value={newDistrictName}
                  onChange={(e) => setNewDistrictName(e.target.value)}
                  placeholder="Misal: Lueng Bata / Kuta Malaka"
                  required
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-abisGreen bg-[#fbf9f3]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-full bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-abisGreen text-white font-bold hover:bg-[#0e2718]"
                >
                  Simpan & Aktifkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
