import React, { useEffect, useState, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  List,
  User,
  HelpCircle,
  LogOut,
  Search,
  MessageSquare,
  Bell,
  Settings,
  Menu,
  X,
  Send,
  Star,
  Package,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { signOutUser } from '../lib/auth'

interface PeternakLayoutProps {
  children: React.ReactNode
}

type PeternakChat = {
  id: string
  sellerName: string
  avatar: string
  lastMessage: string
  time: string
  unread: boolean
  messages: { sender: 'peternak' | 'seller'; text: string; time: string }[]
}

type PeternakNotification = {
  id: string
  title: string
  message: string
  time: string
  type: 'pasokan' | 'chat' | 'poin'
  unread: boolean
  link?: string
}

export default function PeternakLayout({ children }: PeternakLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const [userName, setUserName] = useState<string>('Peternak Maggot')
  const [userRole, setUserRole] = useState<string>('Mitra Peternak')
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Top Navbar Search
  const [searchQuery, setSearchQuery] = useState('')

  // Popover States
  const [showMessageDropdown, setShowMessageDropdown] = useState(false)
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)

  // Active Chat Modal State
  const [activeChat, setActiveChat] = useState<PeternakChat | null>(null)
  const [replyText, setReplyText] = useState('')

  // Popover Refs for Click Outside
  const messageRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  // Real Messages & Notifications State
  const [chats, setChats] = useState<PeternakChat[]>([])
  const [notifications, setNotifications] = useState<PeternakNotification[]>([])

  const unreadChatCount = chats.filter((c) => c.unread).length
  const unreadNotifCount = notifications.filter((n) => n.unread).length

  const fetchProfileAndNotifications = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user) return

    // 1. Fetch Profile
    const { data, error } = await supabase
      .from('profiles')
      .select('name, role, avatar_url, nama_usaha, foto_url')
      .eq('id', session.user.id)
      .single()

    if (data && !error) {
      setUserName(data.nama_usaha || data.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Peternak Maggot')
      setUserRole(data.role === 'peternak' ? 'Mitra Peternak' : data.role || 'Mitra Peternak')
      if (data.avatar_url || data.foto_url) setUserAvatar(data.avatar_url || data.foto_url)
    } else {
      setUserName(session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Peternak Maggot')
    }

    // 2. Fetch Notifications from DB + default fallback
    try {
      const { data: pasokanList } = await supabase
        .from('pasokan_maggot')
        .select('id, status, created_at, postingan_id, berat_aktual, berat_estimasi')
        .eq('peternak_id', session.user.id)
        .order('created_at', { ascending: false })

      let notifList: PeternakNotification[] = []

      if (pasokanList && pasokanList.length > 0) {
        notifList = pasokanList.map((p) => {
          const tDate = new Date(p.created_at)
          const formattedTime = Number.isNaN(tDate.getTime())
            ? 'Baru saja'
            : tDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'

          const weight = p.berat_aktual || p.berat_estimasi || 0
          const isDone = p.status === 'selesai'
          return {
            id: p.id,
            title: isDone ? 'Pengambilan Pasokan Selesai' : 'Pengambilan Pasokan Dikonfirmasi',
            message: `Pasokan pakan sebesar ${weight} kg telah ${isDone ? 'selesai diproses' : 'dikonfirmasi'}. Anda mendapatkan ${Math.floor(weight * 10)} Poin.`,
            time: formattedTime,
            type: 'pasokan',
            unread: !isDone,
            link: '/peternak/riwayat',
          }
        })
      }

      setNotifications(notifList)

      // 3. Global chats from localStorage (filtered strictly for Peternak)
      try {
        const rawGlobal = localStorage.getItem('abis_global_chats')
        if (rawGlobal) {
          const parsed = JSON.parse(rawGlobal)
          if (Array.isArray(parsed) && parsed.length > 0) {
            const peternakOnly = parsed.filter((item: any) =>
              item &&
              (item.isPeternak === true ||
                item.unreadForPeternak !== undefined ||
                item.id?.includes('peternak') ||
                (item.messages && item.messages.some((m: any) => m.sender === 'peternak')))
            )

            const formattedChats: PeternakChat[] = peternakOnly.map((item: any) => ({
              id: item.id || `chat-${Date.now()}`,
              sellerName: item.sellerName || 'Mitra Resto/Warteg',
              avatar: item.avatar || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=120&h=120&fit=crop',
              lastMessage: item.lastMessage || '',
              time: item.time || 'Baru saja',
              unread: item.unreadForPeternak ?? false,
              messages: (item.messages || []).map((m: any) => ({
                sender: m.sender === 'seller' ? 'seller' : 'peternak',
                text: m.text || '',
                time: m.time || 'Baru',
              })),
            }))
            setChats(formattedChats)
          } else {
            setChats([])
          }
        } else {
          setChats([])
        }
      } catch (err) {
        setChats([])
      }
    } catch (e) {
      console.warn('Error fetching peternak data:', e)
      setChats([])
    }
  }

  useEffect(() => {
    fetchProfileAndNotifications()

    const handleProfileUpdate = () => fetchProfileAndNotifications()
    const handleChatUpdate = () => fetchProfileAndNotifications()

    window.addEventListener('profileUpdated', handleProfileUpdate)
    window.addEventListener('abis_chat_updated', handleChatUpdate)
    window.addEventListener('storage', handleChatUpdate)

    const handleClickOutside = (event: MouseEvent) => {
      if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
        setShowMessageDropdown(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate)
      window.removeEventListener('abis_chat_updated', handleChatUpdate)
      window.removeEventListener('storage', handleChatUpdate)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const navItems = [
    { name: 'Beranda', path: '/peternak', icon: Home },
    { name: 'Jelajah Area', path: '/peternak/explore', icon: Search },
    { name: 'Riwayat', path: '/peternak/riwayat', icon: List },
    { name: 'Profile', path: '/peternak/profile', icon: User },
  ]

  const handleLogout = async () => {
    await signOutUser()
    navigate('/auth')
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/peternak/explore?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleNotifClick = (notif: PeternakNotification) => {
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n)))
    setShowNotifDropdown(false)
    if (notif.link) {
      navigate(notif.link)
    }
  }

  const handleMarkAllNotifsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const handleOpenChat = (chat: PeternakChat) => {
    setChats((prev) => prev.map((c) => (c.id === chat.id ? { ...c, unread: false } : c)))
    setActiveChat(chat)
    setShowMessageDropdown(false)
  }

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !activeChat) return

    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
    const newMsg = { sender: 'peternak' as const, text: replyText.trim(), time: nowTime }
    const targetId = activeChat.id

    const updatedMessages = [...activeChat.messages, newMsg]
    const updatedChat = {
      ...activeChat,
      lastMessage: replyText.trim(),
      time: nowTime,
      unread: false,
      messages: updatedMessages,
    }

    setActiveChat(updatedChat)
    setChats((prev) => prev.map((c) => (c.id === targetId ? updatedChat : c)))

    try {
      const rawGlobal = localStorage.getItem('abis_global_chats')
      let globalList: any[] = rawGlobal ? JSON.parse(rawGlobal) : []
      const idx = globalList.findIndex((g) => g.id === targetId || g.sellerName === activeChat.sellerName)

      if (idx > -1) {
        globalList[idx].lastMessage = replyText.trim()
        globalList[idx].time = nowTime
        globalList[idx].unreadForSeller = true
        globalList[idx].unreadForPeternak = false
        globalList[idx].messages = updatedMessages
      } else {
        globalList.unshift({
          id: targetId,
          sellerName: activeChat.sellerName,
          buyerName: userName || 'Peternak Maggot',
          avatar: activeChat.avatar,
          lastMessage: replyText.trim(),
          time: nowTime,
          unreadForSeller: true,
          unreadForPeternak: false,
          messages: updatedMessages,
        })
      }
      localStorage.setItem('abis_global_chats', JSON.stringify(globalList))
      window.dispatchEvent(new Event('abis_chat_updated'))
    } catch (err) {
      console.warn('Sync peternak reply error:', err)
    }

    setReplyText('')
  }

  return (
    <div className="min-h-screen bg-[#123c2f] font-hanken">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* SIDEBAR */}
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
                const isActive =
                  location.pathname === item.path ||
                  (item.path === '/peternak/profile' && location.pathname === '/peternak/profil')
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
            <Link
              to="/peternak/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full bg-abisOrange text-white font-semibold py-3 rounded-full flex items-center justify-center gap-2 hover:bg-[#d67b22] transition shadow-md text-center"
            >
              <Search className="w-5 h-5" /> Cari Sisa Makanan
            </Link>

            <div className="h-px bg-white/20 my-2"></div>

            <Link
              to="/bantuan"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 text-white font-semibold hover:text-abisOrange transition py-2"
            >
              <HelpCircle className="w-5 h-5" /> Bantuan
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false)
                handleLogout()
              }}
              className="flex items-center gap-3 text-white font-semibold hover:text-red-400 transition py-2 text-left"
            >
              <LogOut className="w-5 h-5" /> Keluar
            </button>
          </div>
        </aside>

        {/* MAIN BODY AREA */}
        <div className="flex-1 flex flex-col min-h-screen bg-[#f5f3e8] lg:rounded-l-[2rem] overflow-hidden">
          {/* TOP NAVBAR HEADER */}
          <header className="flex items-center justify-between px-6 lg:px-10 py-6 relative z-30">
            {/* Profile Section */}
            <div
              onClick={() => navigate('/peternak/profile')}
              className="flex items-center gap-4 cursor-pointer group"
              title="Ke Pengaturan Profil"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-abisGreen bg-[#1b4332] shadow-sm flex items-center justify-center group-hover:scale-105 transition">
                <img
                  src={userAvatar || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=300&q=80'}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="font-literata font-bold text-abisGreen text-lg leading-tight uppercase group-hover:text-abisOrange transition">
                  {userName}
                </h2>
                <p className="text-slate-500 text-sm capitalize">{userRole}</p>
              </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl mx-8 relative hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-abisGreen" />
              <input
                type="text"
                placeholder="Cari postingan sisa makanan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border border-abisGreen rounded-full py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-abisGreen placeholder:text-abisGreen/60 text-abisGreen"
              />
            </form>

            {/* Right Action Icons */}
            <div className="flex items-center gap-4 lg:gap-5 text-abisGreen relative">
              {/* MESSAGE ICON & POPOVER */}
              <div className="relative" ref={messageRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowMessageDropdown((prev) => !prev)
                    setShowNotifDropdown(false)
                  }}
                  className="relative p-2 rounded-full hover:bg-emerald-100/60 hover:text-abisOrange transition"
                  title="Pesan & Obrolan"
                >
                  <MessageSquare className="w-6 h-6" fill="currentColor" />
                  {unreadChatCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                      {unreadChatCount}
                    </span>
                  )}
                </button>

                {/* MESSAGE POPOVER */}
                {showMessageDropdown && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white p-4 shadow-2xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between border-b pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-abisGreen" />
                        <h3 className="font-literata font-bold text-slate-900 text-base">Pesan Mitra</h3>
                      </div>
                      <span className="text-xs font-semibold bg-emerald-100 text-abisGreen px-2.5 py-0.5 rounded-full">
                        {unreadChatCount} Baru
                      </span>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {chats.length > 0 ? (
                        chats.map((chat) => (
                          <div
                            key={chat.id}
                            onClick={() => handleOpenChat(chat)}
                            className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition ${
                              chat.unread ? 'bg-emerald-50/70 border border-emerald-200' : 'hover:bg-slate-50'
                            }`}
                          >
                            <img src={chat.avatar} alt={chat.sellerName} className="w-10 h-10 rounded-full object-cover shrink-0 border" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-sm text-slate-900 truncate">{chat.sellerName}</h4>
                                <span className="text-[10px] text-slate-400">{chat.time}</span>
                              </div>
                              <p className="text-xs text-slate-600 truncate mt-0.5">{chat.lastMessage}</p>
                            </div>
                            {chat.unread && <span className="w-2.5 h-2.5 rounded-full bg-abisOrange shrink-0 mt-1" />}
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-xs text-slate-500 font-medium">
                          Belum ada obrolan pesan.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* NOTIFICATION ICON & POPOVER */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifDropdown((prev) => !prev)
                    setShowMessageDropdown(false)
                  }}
                  className="relative p-2 rounded-full hover:bg-emerald-100/60 hover:text-abisOrange transition"
                  title="Notifikasi Peternak"
                >
                  <Bell className="w-6 h-6" fill="currentColor" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>

                {/* NOTIFICATION POPOVER */}
                {showNotifDropdown && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white p-4 shadow-2xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between border-b pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-abisGreen" />
                        <h3 className="font-literata font-bold text-slate-900 text-base">Notifikasi</h3>
                      </div>
                      <button
                        type="button"
                        onClick={handleMarkAllNotifsRead}
                        className="text-xs font-semibold text-abisOrange hover:underline"
                      >
                        Tandai Dibaca
                      </button>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotifClick(n)}
                            className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition ${
                              n.unread ? 'bg-amber-50/70 border border-amber-200 hover:bg-amber-100/70' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="mt-0.5 p-2 rounded-full bg-white shadow-sm shrink-0">
                              {n.type === 'pasokan' && <Package className="w-4 h-4 text-abisGreen" />}
                              {n.type === 'chat' && <MessageSquare className="w-4 h-4 text-emerald-600" />}
                              {n.type === 'poin' && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-xs text-slate-900">{n.title}</h4>
                                <span className="text-[10px] text-slate-400">{n.time}</span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{n.message}</p>
                              <p className="text-[10px] font-bold text-abisGreen mt-1 underline">Lihat detail →</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center text-xs text-slate-500">Belum ada notifikasi baru.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SETTINGS ICON -> DIRECT TO PROFILE */}
              <button
                type="button"
                onClick={() => navigate('/peternak/profile')}
                className="p-2 rounded-full hover:bg-emerald-100/60 hover:text-abisOrange transition"
                title="Pengaturan Profil"
              >
                <Settings className="w-6 h-6" fill="currentColor" />
              </button>
            </div>
          </header>

          {/* PAGE CONTENT */}
          <main className="flex-1 overflow-y-auto px-4 pb-10 sm:px-6 lg:px-10">{children}</main>
        </div>
      </div>

      {/* CHAT MODAL OVERLAY */}
      {activeChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden h-[520px]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-emerald-50">
              <div className="flex items-center gap-3">
                <img
                  src={activeChat.avatar}
                  alt={activeChat.sellerName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-emerald-600"
                />
                <div>
                  <h3 className="font-literata font-bold text-slate-900 text-base">{activeChat.sellerName}</h3>
                  <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" /> Online (Mitra Penjual)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveChat(null)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50">
              {activeChat.messages.map((msg, index) => (
                <div key={index} className={`flex flex-col ${msg.sender === 'peternak' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      msg.sender === 'peternak'
                        ? 'bg-abisGreen text-white rounded-br-none'
                        : 'bg-white border text-slate-800 rounded-bl-none'
                    }`}
                  >
                    <p>{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Reply Form */}
            <form onSubmit={handleSendReply} className="p-4 bg-white border-t flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Ketik pesan untuk mitra..."
                className="flex-1 rounded-full border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-abisGreen"
              />
              <button
                type="submit"
                className="p-2.5 rounded-full bg-abisGreen text-white hover:bg-emerald-800 transition shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

