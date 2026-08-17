import React, { useEffect, useState, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  List,
  Wallet,
  User,
  Plus,
  HelpCircle,
  LogOut,
  Search,
  MessageSquare,
  Bell,
  Settings,
  Menu,
  X,
  CheckCircle2,
  Star,
  ShoppingBag,
  Send,
  Check,
  Package,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { signOutUser } from '../lib/auth'

interface PenjualLayoutProps {
  children: React.ReactNode
}

type BuyerChat = {
  id: string
  buyerName: string
  avatar: string
  lastMessage: string
  time: string
  unread: boolean
  messages: { sender: 'buyer' | 'seller'; text: string; time: string }[]
}

type SellerNotification = {
  id: string
  title: string
  message: string
  time: string
  type: 'order' | 'pasokan' | 'chat' | 'rating' | 'dompet'
  unread: boolean
}

const getDefaultSellerNotifications = (): SellerNotification[] => [
  {
    id: 'notif-seller-1',
    title: 'Pesanan Surplus Baru Diterima',
    message: 'Pembeli Anisa memesan 2 porsi Nasi Ayam Surplus (Rp 30.000). Silakan konfirmasi penjemputan.',
    time: '10 menit lalu',
    type: 'order',
    unread: true,
  },
  {
    id: 'notif-seller-2',
    title: 'Permintaan Pasokan Pakan Organik',
    message: 'Peternak BSF Syiah Kuala mengajukan penjemputan 15 kg sisa makanan organik dapur.',
    time: '30 menit lalu',
    type: 'pasokan',
    unread: true,
  },
  {
    id: 'notif-seller-3',
    title: 'Rating & Ulasan Pembeli',
    message: 'Pembeli Budi memberikan ★ 5.0: "Makanan lezat, porsi melimpah & ramah lingkungan!"',
    time: '2 jam lalu',
    type: 'rating',
    unread: false,
  },
  {
    id: 'notif-seller-4',
    title: 'Saldo Dompet Mitra Bertambah',
    message: 'Pendapatan surplus sebesar Rp 120.000 telah berhasil ditambahkan ke saldo Dompet Mitra.',
    time: 'Kemarin',
    type: 'dompet',
    unread: false,
  },
]

const getDefaultSellerChats = (): BuyerChat[] => [
  {
    id: 'chat-seller-1',
    buyerName: 'Anisa (Pembeli)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
    lastMessage: 'Halo kak, apakah pesanan Nasi Ayam Surplus saya bisa dijemput jam 5 sore?',
    time: '10:15 WIB',
    unread: true,
    messages: [
      { sender: 'buyer', text: 'Halo kak, apakah pesanan Nasi Ayam Surplus saya bisa dijemput jam 5 sore?', time: '10:15 WIB' },
    ],
  },
  {
    id: 'chat-seller-2',
    buyerName: 'Rahmad (Peternak Maggot BSF)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
    lastMessage: 'Halo mitra resto, untuk sisa limbah organik dapur 15 kg sore ini siap diambil jam berapa?',
    time: 'Kemarin',
    unread: false,
    messages: [
      { sender: 'buyer', text: 'Halo mitra resto, untuk sisa limbah organik dapur 15 kg sore ini siap diambil jam berapa?', time: 'Kemarin' },
      { sender: 'seller', text: 'Halo pak Rahmad, sisa organik sudah disortir dalam wadah khusus. Siap diambil pukul 16.30 WIB ya.', time: 'Kemarin' },
    ],
  },
]

export default function PenjualLayout({ children }: PenjualLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const [userName, setUserName] = useState<string>('Memuat...')
  const [userRole, setUserRole] = useState<string>('Mitra Penjual')
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Dropdown States
  const [showMessageDropdown, setShowMessageDropdown] = useState(false)
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)

  // Active Chat Modal State
  const [activeChat, setActiveChat] = useState<BuyerChat | null>(null)
  const [replyText, setReplyText] = useState('')

  // Popover Refs for Click Outside
  const messageRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  // Real Messages & Notifications State
  const [chats, setChats] = useState<BuyerChat[]>([])
  const [notifications, setNotifications] = useState<SellerNotification[]>([])

  const unreadChatCount = chats.filter((c) => c.unread).length
  const unreadNotifCount = notifications.filter((n) => n.unread).length

  const fetchProfileAndNotifications = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    // 1. Fetch Profile
    const { data, error } = await supabase
      .from('profiles')
      .select('name, role, avatar_url, nama_usaha')
      .eq('id', session.user.id)
      .single()
    if (data && !error) {
      setUserName(data.nama_usaha || data.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Penjual')
      setUserRole(data.role === 'penjual' ? 'Mitra Penjual' : data.role)
      if (data.avatar_url) setUserAvatar(data.avatar_url)
    } else {
      setUserName(session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Penjual')
    }

    // 2. Fetch Live Notifications & Chats from DB
    try {
      const { data: myPostings } = await supabase
        .from('postingan_makanan')
        .select('id, nama_makanan')
        .eq('penjual_id', session.user.id)

      if (!myPostings || myPostings.length === 0) {
        setNotifications(getDefaultSellerNotifications())
        setChats(getDefaultSellerChats())
        return
      }

      const postingIds = myPostings.map((p) => p.id)
      const postingMap = new Map(myPostings.map((p) => [p.id, p]))

      const { data: txs } = await supabase
        .from('transaksi_pembelian')
        .select('id, postingan_id, pembeli_id, status, created_at')
        .in('postingan_id', postingIds)
        .order('created_at', { ascending: false })

      if (txs && txs.length > 0) {
        const buyerIds = [...new Set(txs.map((t) => t.pembeli_id).filter(Boolean))]
        let buyerMap = new Map()

        if (buyerIds.length > 0) {
          const { data: buyers } = await supabase
            .from('profiles')
            .select('id, name, email, telepon, avatar_url')
            .in('id', buyerIds)

          if (buyers) {
            buyerMap = new Map(buyers.map((b) => [b.id, b]))
          }
        }

        const notifList: SellerNotification[] = txs.map((tx) => {
          const posting = postingMap.get(tx.postingan_id)
          const buyer = buyerMap.get(tx.pembeli_id)
          const buyerName = buyer?.name || buyer?.email?.split('@')[0] || 'Pembeli'
          const txDate = new Date(tx.created_at)

          const formattedTime = Number.isNaN(txDate.getTime())
            ? 'Baru saja'
            : txDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'

          const title =
            tx.status === 'menunggu'
              ? 'Pesanan Baru Diterima'
              : tx.status === 'terkonfirmasi'
              ? 'Pesanan Disetujui'
              : tx.status === 'selesai'
              ? 'Penjemputan Selesai'
              : 'Pesanan Dibatalkan'

          return {
            id: tx.id,
            title,
            message: `Pembeli ${buyerName} memesan ${posting?.nama_makanan || 'Makanan Surplus'}`,
            time: formattedTime,
            type: 'order',
            unread: tx.status === 'menunggu',
          }
        })

        // Merge with default role-specific seller notifications if list is small
        if (notifList.length < 3) {
          const defaults = getDefaultSellerNotifications().filter(d => !notifList.some(n => n.id === d.id))
          setNotifications([...notifList, ...defaults])
        } else {
          setNotifications(notifList)
        }

        // Dynamic Chats from DB + abis_global_chats from localStorage
        const chatList: BuyerChat[] = buyerIds.map((bId) => {
          const buyer = buyerMap.get(bId)
          const buyerName = buyer?.name || buyer?.email?.split('@')[0] || 'Pembeli'
          const buyerTxs = txs.filter((t) => t.pembeli_id === bId)
          const lastTx = buyerTxs[0]
          const posting = postingMap.get(lastTx?.postingan_id)
          const txDate = new Date(lastTx?.created_at)

          const timeStr = Number.isNaN(txDate.getTime())
            ? 'Baru'
            : txDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'

          return {
            id: bId,
            buyerName,
            avatar: buyer?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop',
            lastMessage: `Pesanan makanan: ${posting?.nama_makanan || 'Makanan Surplus'}. Kontak: ${buyer?.telepon || '-'}`,
            time: timeStr,
            unread: buyerTxs.some((t) => t.status === 'menunggu'),
            messages: [
              {
                sender: 'buyer',
                text: `Halo, saya telah memesan ${posting?.nama_makanan || 'makanan surplus'}. Mohon konfirmasi pesanan saya.`,
                time: timeStr,
              },
            ],
          }
        })

        // Merge chats with abis_global_chats & defaults
        try {
          const rawGlobal = localStorage.getItem('abis_global_chats')
          if (rawGlobal) {
            const parsed = JSON.parse(rawGlobal)
            if (Array.isArray(parsed)) {
              parsed.forEach((item: any) => {
                const existingIndex = chatList.findIndex((c) => c.id === item.id || c.buyerName === item.buyerName)
                const formattedChat: BuyerChat = {
                  id: item.id || `chat-${Date.now()}`,
                  buyerName: item.buyerName || item.sellerName || 'Pembeli Abis.in',
                  avatar: item.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop',
                  lastMessage: item.lastMessage || 'Pesan dari pembeli',
                  time: item.time || 'Baru saja',
                  unread: item.unreadForSeller ?? true,
                  messages: item.messages || [],
                }
                if (existingIndex > -1) {
                  chatList[existingIndex] = formattedChat
                } else {
                  chatList.unshift(formattedChat)
                }
              })
            }
          }
        } catch (e) {}

        setChats(chatList)
      } else {
        setNotifications(getDefaultSellerNotifications())
        // Fallback to load global chats if no orders
        try {
          const rawGlobal = localStorage.getItem('abis_global_chats')
          if (rawGlobal) {
            const parsed = JSON.parse(rawGlobal)
            if (Array.isArray(parsed) && parsed.length > 0) {
              const formattedList: BuyerChat[] = parsed.map((item: any) => ({
                id: item.id || `chat-${Date.now()}`,
                buyerName: item.buyerName || 'Pembeli Abis.in',
                avatar: item.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop',
                lastMessage: item.lastMessage || 'Pesan dari pembeli',
                time: item.time || 'Baru saja',
                unread: item.unreadForSeller ?? true,
                messages: item.messages || [],
              }))
              setChats(formattedList)
              return
            }
          }
        } catch (e) {}
        setChats([])
      }
    } catch (e) {
      console.warn('Real notifications load note:', e)
      setNotifications(getDefaultSellerNotifications())
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
    { name: 'Beranda', path: '/penjual', icon: Home },
    { name: 'Konfirmasi Pesanan', path: '/penjual/pesanan', icon: ShoppingBag },
    { name: 'Postingan Makanan', path: '/penjual/postingan', icon: List },
    { name: 'Dompet', path: '/penjual/dompet', icon: Wallet },
    { name: 'Profile', path: '/penjual/profile', icon: User },
  ]

  const isProfilePage = location.pathname === '/penjual/profile'

  const handleLogout = async () => {
    await signOutUser()
    navigate('/auth')
  }

  const handleNotifClick = (notifId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, unread: false } : n)))
    setShowNotifDropdown(false)
    navigate('/penjual/pesanan')
  }

  const handleOpenChat = (chat: BuyerChat) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chat.id ? { ...c, unread: false } : c))
    )
    setActiveChat(chat)
    setShowMessageDropdown(false)
  }

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !activeChat) return

    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
    const newMsg = { sender: 'seller' as const, text: replyText.trim(), time: nowTime }
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

    setChats((prev) =>
      prev.map((c) => (c.id === targetId ? updatedChat : c))
    )

    // Sync to abis_global_chats & notify buyer
    try {
      const rawGlobal = localStorage.getItem('abis_global_chats')
      let globalList: any[] = rawGlobal ? JSON.parse(rawGlobal) : []
      const idx = globalList.findIndex((g) => g.id === targetId || g.sellerName === activeChat.buyerName || g.buyerName === activeChat.buyerName)

      if (idx > -1) {
        globalList[idx].lastMessage = replyText.trim()
        globalList[idx].time = nowTime
        globalList[idx].unreadForBuyer = true
        globalList[idx].unreadForSeller = false
        globalList[idx].messages = updatedMessages
      } else {
        globalList.unshift({
          id: targetId,
          buyerName: activeChat.buyerName,
          sellerName: userName || 'Mitra Penjual',
          avatar: activeChat.avatar,
          lastMessage: replyText.trim(),
          time: nowTime,
          unreadForBuyer: true,
          unreadForSeller: false,
          messages: updatedMessages,
        })
      }
      localStorage.setItem('abis_global_chats', JSON.stringify(globalList))

      // Add notification for buyer
      const rawBuyerNotifs = localStorage.getItem('abis_buyer_notifs')
      let buyerNotifs: any[] = rawBuyerNotifs ? JSON.parse(rawBuyerNotifs) : []
      buyerNotifs.unshift({
        id: `notif-${Date.now()}`,
        title: `Balasan Chat dari ${userName || 'Penjual'}`,
        message: `${userName || 'Penjual'}: "${replyText.trim().substring(0, 55)}..."`,
        time: nowTime,
        type: 'chat',
        unread: true,
      })
      localStorage.setItem('abis_buyer_notifs', JSON.stringify(buyerNotifs))

      window.dispatchEvent(new Event('abis_chat_updated'))
    } catch (err) {
      console.warn('Sync reply note:', err)
    }

    setReplyText('')
  }

  const handleMarkAllNotifsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
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
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false)
                navigate('/penjual/postingan')
              }}
              className="w-full bg-abisOrange text-white font-semibold py-3 rounded-full flex items-center justify-center gap-2 hover:bg-[#d67b22] transition"
            >
              <Plus className="w-5 h-5" /> Postingan Baru
            </button>

            <div className="h-px bg-white/20 my-2"></div>

            <Link to="/bantuan" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 text-white font-semibold hover:text-abisOrange transition py-2">
              <HelpCircle className="w-5 h-5" /> Bantuan
            </Link>
            <button
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
          
          {/* TOP NAVBAR */}
          <header className="flex items-center justify-between px-10 py-6 relative z-30">
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
                <h2 className="font-literata font-bold text-abisGreen text-lg leading-tight">{userName}</h2>
                <p className="text-slate-500 text-sm capitalize">{userRole}</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-xl mx-8 relative hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-abisGreen" />
              <input
                type="text"
                placeholder="Cari postingan..."
                className="w-full bg-transparent border border-abisGreen rounded-full py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-abisGreen placeholder:text-abisGreen/60 text-abisGreen"
              />
            </div>

            {/* Right Action Icons & Button */}
            <div className="flex items-center gap-4 lg:gap-5 text-abisGreen relative">
              
              {/* MESSAGE ICON & POPOVER */}
              <div className="relative" ref={messageRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowMessageDropdown((prev) => !prev)
                    setShowNotifDropdown(false)
                  }}
                  className="relative p-2 rounded-full hover:bg-emerald-100/50 hover:text-abisOrange transition"
                  title="Pesan Pembeli"
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
                        <h3 className="font-literata font-bold text-slate-900 text-base">Pesan Pembeli</h3>
                      </div>
                      <span className="text-xs font-semibold bg-emerald-100 text-abisGreen px-2.5 py-0.5 rounded-full">
                        {unreadChatCount} Baru
                      </span>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {chats.map((chat) => (
                        <div
                          key={chat.id}
                          onClick={() => handleOpenChat(chat)}
                          className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition ${
                            chat.unread ? 'bg-emerald-50/70 border border-emerald-200' : 'hover:bg-slate-50'
                          }`}
                        >
                          <img src={chat.avatar} alt={chat.buyerName} className="w-10 h-10 rounded-full object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-sm text-slate-900 truncate">{chat.buyerName}</h4>
                              <span className="text-[10px] text-slate-400">{chat.time}</span>
                            </div>
                            <p className="text-xs text-slate-600 truncate mt-0.5">{chat.lastMessage}</p>
                          </div>
                          {chat.unread && <span className="w-2.5 h-2.5 rounded-full bg-abisOrange shrink-0 mt-1" />}
                        </div>
                      ))}
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
                  className="relative p-2 rounded-full hover:bg-emerald-100/50 hover:text-abisOrange transition"
                  title="Notifikasi"
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
                            onClick={() => handleNotifClick(n.id)}
                            className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition ${
                              n.unread ? 'bg-amber-50/70 border border-amber-200 hover:bg-amber-100/70' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="mt-0.5 p-2 rounded-full bg-white shadow-sm shrink-0">
                              {n.type === 'order' && <ShoppingBag className="w-4 h-4 text-abisOrange" />}
                              {n.type === 'pasokan' && <Package className="w-4 h-4 text-emerald-600" />}
                              {n.type === 'chat' && <MessageSquare className="w-4 h-4 text-blue-600" />}
                              {n.type === 'rating' && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                              {n.type === 'dompet' && <Wallet className="w-4 h-4 text-purple-600" />}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-xs text-slate-900">{n.title}</h4>
                                <span className="text-[10px] text-slate-400">{n.time}</span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{n.message}</p>
                              <p className="text-[10px] font-bold text-abisGreen mt-1 underline">Klik untuk konfirmasi pesanan →</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center text-xs text-slate-500">
                          Belum ada notifikasi pesanan masuk.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SETTINGS ICON -> DIRECT TO PROFILE */}
              <button
                type="button"
                onClick={() => navigate('/penjual/profile')}
                className="p-2 rounded-full hover:bg-emerald-100/50 hover:text-abisOrange transition"
                title="Pengaturan Profil"
              >
                <Settings className="w-6 h-6" fill="currentColor" />
              </button>

              {/* POSTING BARU BUTTON */}
              <button
                onClick={() => navigate('/penjual/postingan')}
                className="bg-abisOrange text-white font-semibold px-5 py-2.5 rounded-full items-center gap-2 hover:bg-[#d67b22] transition ml-1 hidden sm:flex shadow-sm"
              >
                <Plus className="w-5 h-5" /> Postingan Baru
              </button>
            </div>
          </header>

          {/* PAGE CONTENT */}
          <main className={`flex-1 overflow-y-auto ${isProfilePage ? 'px-4 pb-8 sm:px-6 lg:px-6' : 'px-4 pb-10 sm:px-6 lg:px-10'}`}>
            {children}
          </main>
        </div>
      </div>

      {/* CHAT MODAL OVERLAY */}
      {activeChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden h-[520px]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-emerald-50">
              <div className="flex items-center gap-3">
                <img src={activeChat.avatar} alt={activeChat.buyerName} className="w-10 h-10 rounded-full object-cover border-2 border-emerald-600" />
                <div>
                  <h3 className="font-literata font-bold text-slate-900 text-base">{activeChat.buyerName}</h3>
                  <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" /> Online (Pembeli)
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
                <div
                  key={index}
                  className={`flex flex-col ${msg.sender === 'seller' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      msg.sender === 'seller'
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
                placeholder="Ketik balasan untuk pembeli..."
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
