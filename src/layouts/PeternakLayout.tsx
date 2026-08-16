import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, List, Wallet, User, Plus, HelpCircle, LogOut, Search, MessageSquare, Bell, Settings, Edit2, Menu, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { signOutUser } from '../lib/auth'

interface PeternakLayoutProps {
  children: React.ReactNode
}

export default function PeternakLayout({ children }: PeternakLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  
  const [userName, setUserName] = useState<string>('Peternak Maggot')
  const [userRole, setUserRole] = useState<string>('Mitra Peternak')
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data, error } = await supabase.from('profiles').select('name, role, avatar_url, nama_usaha').eq('id', session.user.id).single()
        if (data && !error) {
          setUserName(data.nama_usaha || data.name || session.user.email?.split('@')[0] || 'Peternak Maggot')
          setUserRole(data.role === 'peternak' ? 'Mitra Peternak' : data.role)
          if (data.avatar_url) setUserAvatar(data.avatar_url)
        } else {
          setUserName(session.user.email?.split('@')[0] || 'Peternak Maggot')
        }
      }
    }
    fetchProfile()
  }, [])
  
  const getInitials = (name: string) => {
    if (name === 'Memuat...' || !name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }
  
  const navItems = [
    { name: 'Beranda', path: '/peternak', icon: Home },
    { name: 'Jelajah', path: '/peternak/explore', icon: Search },
    { name: 'Riwayat', path: '/peternak/riwayat', icon: List },
    { name: 'Profile', path: '/peternak/profile', icon: User },
  ]

  const isProfilePage = location.pathname === '/peternak/profile'

  const handleLogout = async () => {
    await signOutUser()
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-[#123c2f] font-hanken">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full bg-[#123c2f] lg:w-[260px] lg:flex lg:flex-col lg:justify-between lg:py-8">
          <div>
            <div className="flex items-center justify-between px-5 py-4 lg:px-8 lg:py-0">
              <Link to="/" className="block">
                <img src="/images/Logo sidebar.png" alt="Abis.in" className="h-12 w-auto object-contain lg:h-16" />
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

            <nav className={`${mobileMenuOpen ? 'flex' : 'hidden'} flex-col gap-2 pb-4 pt-2 lg:flex lg:pb-0 lg:pt-0`}>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 py-4 font-semibold transition-colors ${
                      isActive 
                        ? 'bg-[#F8F9EB] text-abisGreen rounded-l-[2rem] ml-3 pl-5 lg:ml-6 lg:pl-6' 
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
            
            <Link to="/bantuan" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 text-white font-semibold hover:text-abisOrange transition py-2">
              <HelpCircle className="w-5 h-5" /> Bantuan
            </Link>
            <button onClick={() => { setMobileMenuOpen(false); handleLogout() }} className="flex items-center gap-3 text-white font-semibold hover:text-red-400 transition py-2 text-left">
              <LogOut className="w-5 h-5" /> Keluar
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-h-screen bg-[#f5f3e8] lg:rounded-l-[2rem] overflow-hidden">
          {!isProfilePage && (
            <header className="flex items-center justify-between px-10 py-6">
              {/* Profile Section */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-abisGreen bg-[#1b4332] shadow-sm flex items-center justify-center">
                  <img 
                    src={userAvatar || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=300&q=80'} 
                    alt={userName} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="font-literata font-bold text-abisGreen text-lg leading-tight uppercase">{userName}</h2>
                  <p className="text-slate-500 text-sm capitalize">{userRole}</p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex-1 max-w-xl mx-8 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-abisGreen" />
                <input 
                  type="text" 
                  placeholder="Cari postingan" 
                  className="w-full bg-transparent border border-abisGreen rounded-full py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-abisGreen placeholder:text-abisGreen/60 text-abisGreen"
                />
              </div>

              {/* Right Icons */}
              <div className="flex items-center gap-6 text-abisGreen">
                <button className="hover:text-abisOrange transition"><MessageSquare className="w-6 h-6" fill="currentColor" /></button>
                <button className="hover:text-abisOrange transition"><Bell className="w-6 h-6" fill="currentColor" /></button>
                <button className="hover:text-abisOrange transition"><Settings className="w-6 h-6" fill="currentColor" /></button>
              </div>
            </header>
          )}

          {/* PAGE CONTENT */}
          <main className={`flex-1 overflow-y-auto ${isProfilePage ? 'px-4 pb-8 sm:px-6 lg:px-6' : 'px-4 pb-10 sm:px-6 lg:px-10'}`}>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
