import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { setCachedUserRole } from '../lib/auth'
import { Store, ShoppingBag, Bug } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

const roles = ['penjual', 'pembeli', 'peternak'] as const
type Role = (typeof roles)[number]

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [role, setRole] = useState<Role>('penjual')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    const cleanEmail = email.trim()

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Silakan masukkan alamat email yang valid (contoh: user@gmail.com)')
      setLoading(false)
      return
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Konfirmasi kata sandi tidak cocok')
        setLoading(false)
        return
      }

      // 1. Sign up user with metadata options in Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            role,
            name,
            nama_usaha: role === 'penjual' || role === 'peternak' ? name : null,
            alamat: address || null,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      if (!data?.user) {
        setError('Gagal membuat akun. Silakan coba lagi.')
        setLoading(false)
        return
      }

      // 2. Insert/Upsert profile to database (gracefully fallback if RLS or email confirm blocks insert)
      try {
        await supabase.from('profiles').upsert(
          {
            id: data.user.id,
            email: cleanEmail,
            role,
            nama_usaha: role === 'penjual' || role === 'peternak' ? name : null,
            status_verifikasi: 'pending',
          },
          { onConflict: 'id' }
        )
      } catch (e) {
        console.warn('Profile DB upsert note:', e)
      }

      // Cache the role in client storage for smooth navigation
      setCachedUserRole(data.user.id, role)

      // 3. If email confirmation is required, inform user, otherwise navigate to role dashboard
      if (!data.session) {
        setSuccessMessage('Pendaftaran berhasil! Silakan periksa kotak masuk email Anda untuk melakukan konfirmasi, lalu masuk ke akun Anda.')
        setLoading(false)
        return
      }

      navigate(`/${role}`)
      setLoading(false)
      return
    }

    // Sign in mode
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
    if (signInError) {
      setError(signInError.message)
    } else if (data?.user) {
      let targetRole = ''

      try {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
        if (profile?.role) {
          targetRole = profile.role
        }
      } catch (e) {
        console.warn('Profile fetch note:', e)
      }

      if (!targetRole) {
        targetRole = (data.user.user_metadata?.role as string | undefined) || role || 'pembeli'
      }

      const finalRole: string = targetRole || 'pembeli'
      setCachedUserRole(data.user.id, finalRole)
      navigate(`/${finalRole}`)
    }
    setLoading(false)
  }

  const inputClass = "w-full rounded-[0.75rem] border border-abisGreen/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-abisGreen focus:border-abisGreen placeholder:text-slate-400"

  const renderRegisterFields = () => {
    return (
      <div className="space-y-4">
        {role === 'penjual' && (
          <>
            <div>
              <input type="text" placeholder="Nama Usaha" value={name} onChange={e => setName(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <input type="email" placeholder="Alamat Email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <input type="text" placeholder="Alamat Usaha" value={address} onChange={e => setAddress(e.target.value)} required className={inputClass} />
            </div>
          </>
        )}
        {role === 'pembeli' && (
          <>
            <div>
              <input type="text" placeholder="Nama Lengkap" value={name} onChange={e => setName(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <input type="email" placeholder="Alamat Email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} />
            </div>
          </>
        )}
        {role === 'peternak' && (
          <>
            <div>
              <input type="text" placeholder="Nama Usaha" value={name} onChange={e => setName(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <input type="email" placeholder="Alamat Email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <input type="text" placeholder="Lokasi Peternakan" value={address} onChange={e => setAddress(e.target.value)} required className={inputClass} />
            </div>
          </>
        )}
        <div>
          <input type="password" placeholder="Kata Sandi" value={password} onChange={e => setPassword(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <input type="password" placeholder="Konfirmasi Kata Sandi" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={inputClass} />
        </div>
      </div>
    )
  }

  const renderLoginFields = () => (
    <div className="space-y-4">
      <div>
        <input type="email" placeholder="Alamat Email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} />
      </div>
      <div>
        <input type="password" placeholder="Kata Sandi" value={password} onChange={e => setPassword(e.target.value)} required className={inputClass} />
      </div>
      <div>
        <a href="#" className="text-xs text-slate-500 hover:text-abisGreen font-medium">Lupa kata sandi?</a>
      </div>
    </div>
  )

  const renderRoleSelector = () => (
    <div className="flex items-center gap-3 w-full mb-6 mt-4 overflow-x-auto pb-2">
      <button 
        type="button" 
        onClick={() => setRole('penjual')}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition whitespace-nowrap
          ${role === 'penjual' ? 'bg-abisGreen text-white border-abisGreen' : 'border-abisGreen text-abisGreen hover:bg-abisGreen/5'}`}
      >
        <Store className="w-4 h-4" /> Penjual
      </button>
      <button 
        type="button" 
        onClick={() => setRole('pembeli')}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition whitespace-nowrap
          ${role === 'pembeli' ? 'bg-abisGreen text-white border-abisGreen' : 'border-abisGreen text-abisGreen hover:bg-abisGreen/5'}`}
      >
        <ShoppingBag className="w-4 h-4" /> Pembeli
      </button>
      <button 
        type="button" 
        onClick={() => setRole('peternak')}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition whitespace-nowrap
          ${role === 'peternak' ? 'bg-abisGreen text-white border-abisGreen' : 'border-abisGreen text-abisGreen hover:bg-abisGreen/5'}`}
      >
        <Bug className="w-4 h-4" /> Peternak Maggot
      </button>
    </div>
  )

  const renderSocials = () => (
    <div className="flex items-center gap-4 justify-center mt-8">
      <button type="button" className="w-12 h-12 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 transition">
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
      </button>
      <button type="button" className="w-12 h-12 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 transition">
        <img src="https://www.svgrepo.com/show/511330/apple-173.svg" className="w-6 h-6" alt="Apple" />
      </button>
      <button type="button" className="w-12 h-12 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 transition">
        <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" className="w-6 h-6" alt="Facebook" />
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-abisCream flex flex-col md:flex-row relative overflow-hidden font-hanken">
      {/* Decorative Circles Background */}
      <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 w-[35vw] h-[35vw] border border-abisGreen/10 rounded-full pointer-events-none"></div>
      <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 w-[30vw] h-[30vw] border border-abisGreen/10 rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-[45vw] h-[45vw] border border-abisGreen/10 rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -translate-x-1/3 translate-y-1/3 w-[35vw] h-[35vw] border border-abisGreen/10 rounded-full pointer-events-none"></div>

      {/* Middle Vertical Separator */}
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[1px] bg-abisGreen/10 z-10"></div>

      {/* TOP LEFT BACK BUTTON */}
      <div className="absolute top-6 left-6 z-50">
        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur border border-abisGreen/20 rounded-full text-xs font-semibold text-abisGreen hover:bg-white transition">
          <span className="text-lg leading-none">&larr;</span> Utama
        </Link>
      </div>

      {/* LEFT PANEL */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 relative z-20">
        {mode === 'signup' ? (
          // CTA Welcome Back (for navigating to Sign In)
          <div className="max-w-md w-full space-y-4">
            <h1 className="text-5xl md:text-6xl font-literata font-semibold text-abisGreen leading-tight">
              Selamat Datang <br/><span className="text-abisOrange font-bold">Kembali</span>
            </h1>
            <p className="text-slate-700 max-w-xs text-sm pt-2 pb-4">
              Masuk untuk melanjutkan perjalanan Anda dalam mengurangi limbah makanan bersama Abis.in.
            </p>
            <button onClick={() => { setMode('signin'); setError(null); setSuccessMessage(null); }} className="px-10 py-2.5 rounded-md bg-abisGreen text-white font-semibold text-sm hover:bg-[#144129] transition">
              Masuk
            </button>
          </div>
        ) : (
          // Login Form
          <div className="max-w-md w-full">
            <h2 className="text-4xl md:text-5xl font-literata font-semibold text-abisGreen">
              Masuk <br/>ke akun<span className="text-abisOrange font-bold">.</span>
            </h2>
            <p className="text-xs text-slate-500 mt-6 mb-2">Pilih peran yang sesuai untuk mendapatkan pengalaman dan fitur yang tepat.</p>
            {renderRoleSelector()}
            
            <p className="text-xs text-slate-400 mb-6 text-center">Masuk menggunakan email untuk mengakses akun Abis.in.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {renderLoginFields()}
              
              {successMessage && <p className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200">{successMessage}</p>}
              {error && <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
              
              {renderSocials()}
              
              <div className="pt-6 flex justify-center">
                <button disabled={loading} type="submit" className="px-12 py-2.5 rounded-md bg-abisGreen text-white font-semibold text-sm hover:bg-[#144129] transition">
                  {loading ? 'Memproses...' : 'Masuk'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 relative z-20">
        {mode === 'signin' ? (
          // CTA Mari Mulai Bersama (for navigating to Sign Up)
          <div className="max-w-md w-full space-y-4 md:pl-12">
            <h1 className="text-5xl md:text-6xl font-literata font-semibold text-abisGreen leading-tight">
              Mari Mulai <br/>Bersama <span className="text-abisOrange font-bold">Abis.in!</span>
            </h1>
            <p className="text-slate-700 max-w-xs text-sm pt-2 pb-4">
              Daftar menggunakan email untuk mulai menikmati semua fitur Abis.in.
            </p>
            <button onClick={() => { setMode('signup'); setError(null); setSuccessMessage(null); }} className="px-10 py-2.5 rounded-md bg-abisGreen text-white font-semibold text-sm hover:bg-[#144129] transition">
              Daftar
            </button>
          </div>
        ) : (
          // Register Form
          <div className="max-w-md w-full md:pl-12">
            <h2 className="text-4xl md:text-5xl font-literata font-semibold text-abisGreen">
              Buat <br/>akun baru<span className="text-abisOrange font-bold">.</span>
            </h2>
            <p className="text-xs text-slate-500 mt-6 mb-2">Pilih peran yang sesuai untuk mendapatkan pengalaman dan fitur yang tepat.</p>
            {renderRoleSelector()}
            
            <p className="text-xs text-slate-400 mb-6 text-center">Daftar menggunakan email untuk mulai menjual makanan surplus yang masih layak konsumsi.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {renderRegisterFields()}
              
              {successMessage && <p className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200">{successMessage}</p>}
              {error && <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
              
              {renderSocials()}
              
              <div className="pt-6 flex justify-center">
                <button disabled={loading} type="submit" className="px-12 py-2.5 rounded-md bg-abisGreen text-white font-semibold text-sm hover:bg-[#144129] transition">
                  {loading ? 'Memproses...' : 'Daftar'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
