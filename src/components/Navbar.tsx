import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { signOutUser } from '../lib/auth'
import { useLocation } from 'react-router-dom'

export default function Navbar() {
  const [email, setEmail] = useState<string | null>(null)
  const location = useLocation()

  // Sembunyikan Navbar global ini di halaman Beranda, Auth, dan Penjual (karena punya layout sendiri)
  if (location.pathname === '/' || location.pathname === '/auth' || location.pathname.startsWith('/penjual')) {
    return null
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null))
  }, [])

  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <img src="/images/Logo.png" alt="Abis.in Logo" className="h-8 w-auto" />
        </div>
        <div className="flex items-center gap-4">
          {email && <span className="text-sm text-slate-600">{email}</span>}
          <button onClick={signOutUser} className="rounded-2xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
            Keluar
          </button>
        </div>
      </div>
    </header>
  )
}
