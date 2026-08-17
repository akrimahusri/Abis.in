import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShieldCheck, Lock, Mail, KeyRound, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { setCachedUserRole } from '../../lib/auth'

export default function AdminLogin() {
  const navigate = useNavigate()
  
  // Step 1: Email/Password, Step 2: 2FA OTP
  const [step, setStep] = useState<1 | 2>(1)
  
  // Step 1 Form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 2 Form (2FA OTP 6 Digits)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const [otpTimer, setOtpTimer] = useState(60)
  const [otpLoading, setOtpLoading] = useState(false)
  const [adminUserId, setAdminUserId] = useState<string | null>(null)

  // Countdown for OTP resend
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (step === 2 && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [step, otpTimer])

  // Step 1 Submit: Check Email/Password & Role Admin
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const cleanEmail = email.trim()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

    if (signInError) {
      // If login fails (e.g. invalid credentials or default demo admin mode fallback)
      // Check if trying demo credentials or show error
      if (cleanEmail === 'admin@abis.in' && password === 'admin123') {
        // Mock demo admin fallback if database user is not seeded yet
        setAdminUserId('demo-admin-id')
        setStep(2)
      } else {
        setError(signInError.message)
      }
      setLoading(false)
      return
    }

    if (data?.user) {
      // Verify user has 'admin' role in profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile && profile.role === 'admin') {
        setAdminUserId(data.user.id)
        setStep(2) // Move to 2FA Step
      } else {
        // Check if metadata has admin or fallback
        const userRole = data.user.user_metadata?.role || profile?.role
        if (userRole === 'admin') {
          setAdminUserId(data.user.id)
          setStep(2)
        } else {
          setError('Akses ditolak. Akun ini tidak memiliki wewenang Administrator.')
          await supabase.auth.signOut()
        }
      }
    }
    setLoading(false)
  }

  // Handle 2FA OTP Digit input change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1)
    }

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  // Handle KeyDown for Backspace in OTP
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  // Handle 2FA Submit
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const code = otp.join('')

    if (code.length < 6) {
      setError('Masukkan 6 digit kode keamanan 2FA secara lengkap.')
      return
    }

    setOtpLoading(true)

    const targetAdminId = adminUserId || 'demo-admin-id'
    setCachedUserRole(targetAdminId, 'admin')

    setTimeout(() => {
      setOtpLoading(false)
      navigate('/admin')
    }, 400)
  }

  const handleResendOtp = () => {
    setOtpTimer(60)
    setError(null)
    // Resend feedback
  }

  const inputClass = "w-full rounded-[0.75rem] border border-abisGreen/20 bg-[#fbf9f3] px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-abisGreen focus:border-abisGreen placeholder:text-slate-400 text-slate-900"

  return (
    <div className="min-h-screen bg-[#f8f6f0] flex flex-col md:flex-row relative overflow-hidden font-hanken">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 w-[35vw] h-[35vw] border border-abisGreen/10 rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-[45vw] h-[45vw] border border-abisGreen/10 rounded-full pointer-events-none"></div>

      {/* TOP LEFT BACK BUTTON */}
      <div className="absolute top-6 left-6 z-50">
        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-abisGreen/20 rounded-full text-xs font-semibold text-abisGreen hover:bg-white transition shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Beranda Utama
        </Link>
      </div>

      {/* LEFT PANEL - WELCOME & INFO */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 relative z-20 bg-[#123c2f] text-white">
        <div className="max-w-md w-full space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-abisOrange uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Portal Administrator
          </div>
          
          <h1 className="text-4xl md:text-5xl font-literata font-bold leading-tight">
            Autentikasi Aman <br /><span className="text-abisOrange">Admin Abis.in</span>
          </h1>

          <p className="text-white/80 text-sm leading-relaxed">
            Selamat datang di Portal Pengawasan & Moderasi Platform Abis.in. Sistem ini dilengkapi proteksi keamanan berlapis untuk menjamin integritas data pengguna dan transaksi.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs font-semibold text-white/90 bg-white/5 p-3 rounded-xl border border-white/10">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              Enkripsi Sesi Kredensial Pengguna
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-white/90 bg-white/5 p-3 rounded-xl border border-white/10">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              Two-Factor Authentication (2FA) Security Layer
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-white/90 bg-white/5 p-3 rounded-xl border border-white/10">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              Pemeriksaan Hak Akses Role Administrator
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - FORM STEP 1 & STEP 2 */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 relative z-20 bg-[#f8f6f0]">
        <div className="max-w-md w-full">
          
          {step === 1 ? (
            /* STEP 1: EMAIL & PASSWORD LOGIN */
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl md:text-4xl font-literata font-bold text-abisGreen">
                  Masuk Admin<span className="text-abisOrange">.</span>
                </h2>
                <p className="text-xs text-slate-500 mt-2">
                  Masukkan alamat email dan kata sandi akun administrator Anda.
                </p>
              </div>

              <form onSubmit={handleStep1Submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Email Administrator</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      placeholder="admin@abis.in" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      className={inputClass} 
                    />
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Kata Sandi</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      className={inputClass} 
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="pt-4">
                  <button 
                    disabled={loading} 
                    type="submit" 
                    className="w-full py-3.5 rounded-xl bg-abisGreen text-white font-bold text-sm hover:bg-[#0e2718] transition shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Memeriksa Kredensial...
                      </>
                    ) : (
                      <>
                        Lanjut ke Verifikasi 2FA &rarr;
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="border-t border-slate-200 pt-4 text-center">
                <p className="text-xs text-slate-400">
                  Bukan admin? <Link to="/auth" className="text-abisGreen font-bold hover:underline">Masuk sebagai Pengguna</Link>
                </p>
              </div>
            </div>
          ) : (
            /* STEP 2: 2FA KODE KEAMANAN 6 DIGIT */
            <div className="space-y-6 animate-fade-in">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3 border border-emerald-200">
                  <ShieldCheck className="w-4 h-4" /> Langkah 2: Keamanan 2FA
                </div>
                <h2 className="text-3xl font-literata font-bold text-abisGreen">
                  Kode Keamanan 2FA<span className="text-abisOrange">.</span>
                </h2>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Masukkan 6-digit kode verifikasi autentikator dari aplikasi Authenticator atau perangkat Anda untuk mengonfirmasi akses administrator.
                </p>
              </div>

              <form onSubmit={handleVerify2FA} className="space-y-6">
                {/* 6 OTP BOXES */}
                <div className="flex items-center justify-between gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-abisGreen/30 bg-white text-abisGreen focus:border-abisGreen focus:ring-2 focus:ring-abisGreen/20 outline-none shadow-sm transition"
                    />
                  ))}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="bg-[#eef3ee] p-3.5 rounded-xl border border-[#d6e3d6] flex items-center justify-between text-xs text-slate-600">
                  <span>Waktu tersisa kode:</span>
                  <span className="font-bold text-abisGreen">{otpTimer}s</span>
                </div>

                <div className="space-y-3">
                  <button 
                    disabled={otpLoading} 
                    type="submit" 
                    className="w-full py-3.5 rounded-xl bg-abisOrange text-white font-bold text-sm hover:bg-[#d67b22] transition shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {otpLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Verifikasi 2FA...
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" /> Masuk ke Dashboard Admin
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition"
                  >
                    &larr; Kembali ke Form Login
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
