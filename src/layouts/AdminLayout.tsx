import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, UserCheck, MapPin, ShieldAlert, Users, Lock, FileText, LogOut, HelpCircle, Search, Bell, Settings, ShieldCheck, Menu, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { signOutUser } from '../lib/auth'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  
  const [userName, setUserName] = useState<string>('Admin Abis.in')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data, error } = await supabase.from('profiles').select('name, role').eq('id', session.user.id).single()
        if (data && !error) {
          setUserName(data.name || session.user.email?.split('@')[0] || 'Admin Abis.in')
        } else {
          setUserName(session.user.email?.split('@')[0] || 'Admin Abis.in')
        }
      }
    }
    fetchProfile()
  }, [])
  
  const getInitials = (name: string) => {
    if (!name) return 'AD'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }
  
  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Verifikasi Mitra', path: '/admin/verifikasi', icon: UserCheck },
    { name: 'Manajemen Wilayah', path: '/admin/wilayah', icon: MapPin },
    { name: 'Moderasi & Laporan', path: '/admin/moderasi', icon: ShieldAlert },
    { name: 'Manajemen Pengguna', path: '/admin/pengguna', icon: Users },
    { name: 'Log Audit & Keamanan', path: '/admin/audit', icon: Lock },
    { name: 'Kebijakan Privasi', path: '/admin/kebijakan', icon: FileText },
  ]

  const handleLogout = async () => {
    await signOutUser()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-[#123c2f] font-hanken">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* SIDEBAR ADMIN */}
        <aside className="w-full bg-[#123c2f] lg:w-[270px] lg:flex lg:flex-col lg:justify-between lg:py-8 lg:shrink-0">
          <div>
            <div className="flex items-center justify-between px-5 py-4 lg:px-8 lg:py-0">
              <Link to="/admin" className="block">
                <img src="/images/Logo sidebar.png" alt="Abis.in Admin" className="h-12 w-auto object-contain lg:h-16" />
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white lg:hidden"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

            <nav className={`${mobileMenuOpen ? 'flex' : 'hidden'} flex-col gap-2 pb-4 pt-4 lg:flex lg:pb-0 lg:pt-6`}>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path === '/admin' && location.pathname === '/admin/dashboard')
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 py-4 font-semibold transition-colors ${
                      isActive 
                        ? 'bg-[#F8F9EB] text-abisGreen rounded-l-[2rem] ml-3 pl-5 lg:ml-6 lg:pl-6 shadow-sm' 
                        : 'text-white hover:bg-white/5 ml-3 pl-5 rounded-l-[2rem] lg:ml-6 lg:pl-6'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} flex-col gap-4 px-5 pb-6 lg:flex lg:px-8 lg:pb-0`}>
            <div className="mb-2 p-3 rounded-2xl bg-white/10 border border-white/10 text-white flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-abisOrange shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-white">Sistem Administrator</p>
                <p className="text-white/70">Akses Penuh Moderasi</p>
              </div>
            </div>
            
            <button 
              onClick={() => { setMobileMenuOpen(false); handleLogout() }} 
              className="flex items-center gap-3 text-white font-semibold hover:text-red-400 transition py-2 text-left"
            >
              <LogOut className="w-5 h-5" /> Keluar Administrator
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-h-screen bg-[#f5f3e8] lg:rounded-l-[2.5rem] overflow-hidden shadow-2xl">
          <header className="flex items-center justify-between px-6 py-5 lg:px-10 lg:py-6 border-b border-black/5 bg-[#f5f3e8]">
            {/* Admin Info */}
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-abisGreen text-white flex items-center justify-center border-2 border-abisGreen font-bold text-base shadow-sm">
                {getInitials(userName)}
              </div>
              <div>
                <h2 className="font-literata font-bold text-abisGreen text-lg leading-tight">{userName}</h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-semibold text-abisGreen">Administrator Aktif</span>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-abisGreen" />
              <input 
                type="text" 
                placeholder="Cari pengguna, transaksi, atau mitra..." 
                className="w-full bg-white/80 border border-abisGreen/20 rounded-full py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-abisGreen placeholder:text-slate-400 text-slate-800 shadow-inner"
              />
            </div>

            {/* Header Right */}
            <div className="flex items-center gap-4 text-abisGreen">
              <button title="Notifikasi System" className="p-2.5 rounded-full hover:bg-abisGreen/10 transition relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-abisOrange"></span>
              </button>
              <button title="Pengaturan Admin" className="p-2.5 rounded-full hover:bg-abisGreen/10 transition">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* PAGE CONTENT */}
          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
