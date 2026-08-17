import React, { useEffect, useState } from 'react'
import PeternakLayout from '../../layouts/PeternakLayout'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Check, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function PeternakKonfirmasi() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [weight, setWeight] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [postingInfo, setPostingInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPosting = async () => {
      if (!id) return
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('postingan_makanan')
          .select('id, nama_makanan, jumlah')
          .eq('id', id)
          .single()

        if (!fetchErr && data) {
          setPostingInfo(data)
          setWeight(data.jumlah ? String(data.jumlah) : '')
        }
      } catch (err) {
        console.warn('Error fetching posting info:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPosting()
  }, [id])

  const pricePerKg = 0 // Free organic waste pickup
  const totalHarga = weight ? parseFloat(weight) * pricePerKg : 0

  const handleConfirmPickup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    const actualWeight = parseFloat(weight)
    if (!actualWeight || actualWeight <= 0) {
      setError('Masukkan berat aktual timbangan yang valid.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        setError('Sesi login tidak ditemukan. Silakan login kembali.')
        setSubmitting(false)
        return
      }

      const peternakId = session.user.id

      // 1. Insert row into pasokan_maggot
      const { error: pasokanErr } = await supabase.from('pasokan_maggot').insert({
        postingan_id: id,
        peternak_id: peternakId,
        berat_estimasi: postingInfo?.jumlah || actualWeight,
        berat_aktual: actualWeight,
        harga_per_kg: pricePerKg,
        total_token: Math.floor(actualWeight * 10),
        status: 'selesai',
      })

      if (pasokanErr) {
        console.warn('Note on pasokan_maggot insert:', pasokanErr.message)
      }

      // 2. Update postingan_makanan status to 'diambil_maggot'
      await supabase
        .from('postingan_makanan')
        .update({ status: 'diambil_maggot' })
        .eq('id', id)

      // 3. Navigate to Riwayat page
      navigate('/peternak/riwayat')
    } catch (err: any) {
      console.warn('Error confirming pickup:', err)
      setError(err.message || 'Gagal mengonfirmasi serah terima.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <PeternakLayout>
        <div className="max-w-2xl mx-auto py-20 text-center flex items-center justify-center gap-3 text-abisGreen font-bold">
          <Loader2 className="w-8 h-8 animate-spin" /> Memuat data serah terima...
        </div>
      </PeternakLayout>
    )
  }

  return (
    <PeternakLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <Link to={`/peternak/detail/${id}`} className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-600 hover:text-abisGreen hover:bg-green-50 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-sm font-bold text-abisGreen">
            🌱
          </div>
        </div>

        <div className="text-center space-y-4 max-w-lg mx-auto">
          <h1 className="text-3xl font-literata font-bold text-abisGreen">Konfirmasi Serah Terima</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Pastikan berat makanan yang ditimbang sesuai dengan yang Anda input dan diverifikasi oleh Penjual sebelum mengkonfirmasi.
          </p>
        </div>

        {/* INPUT CARD */}
        <form onSubmit={handleConfirmPickup} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-6">
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Berat Aktual (Timbangan) {postingInfo?.nama_makanan && `- ${postingInfo.nama_makanan}`}
            </label>
            <div className="relative">
              <input 
                type="number"
                step="0.1"
                min="0.1"
                required
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-6 pl-8 pr-16 text-4xl font-bold text-abisGreen focus:outline-none focus:border-abisGreen focus:bg-white transition-colors"
                autoFocus
              />
              <span className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">kg</span>
            </div>
          </div>

          <div className="h-px bg-slate-100 my-6"></div>

          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-600">Total Biaya (Jika Ada)</p>
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-1">Gratis / Pakan Organik</p>
              <p className="text-2xl font-bold text-abisOrange">Rp {totalHarga.toLocaleString('id-ID')}</p>
            </div>
          </div>

          {error && <p className="text-sm font-semibold text-red-600 text-center">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-abisGreen text-white font-bold py-4 rounded-full text-lg hover:bg-[#0e2718] transition flex items-center justify-center gap-2 mt-8 shadow-md disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" /> Menyimpan Konfirmasi...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-6 h-6" /> Konfirmasi & Selesaikan Tugas
              </>
            )}
          </button>
        </form>

        {/* STEPPER */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="bg-green-50 rounded-xl p-4 border border-green-100 relative">
            <div className="w-6 h-6 rounded-full bg-abisGreen text-white flex items-center justify-center text-xs font-bold mb-2">
              <Check className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-abisGreen">Langkah 1</p>
            <p className="text-xs text-slate-600 font-medium">Penjemputan Lokasi</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100 relative">
            <div className="w-6 h-6 rounded-full bg-abisGreen text-white flex items-center justify-center text-xs font-bold mb-2">
              <Check className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-abisGreen">Langkah 2</p>
            <p className="text-xs text-slate-600 font-medium">Timbang Makanan</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100 relative shadow-sm">
            <div className="w-6 h-6 rounded-full bg-abisGreen text-white flex items-center justify-center text-xs font-bold mb-2">
              3
            </div>
            <p className="text-xs font-bold text-abisGreen">Langkah 3</p>
            <p className="text-xs text-slate-600 font-medium">Konfirmasi Berat</p>
          </div>
        </div>

      </div>
    </PeternakLayout>
  )
}

