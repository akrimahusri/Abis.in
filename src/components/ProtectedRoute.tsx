import { ReactNode, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCachedUserRole, getStoredRole, setCachedUserRole } from '../lib/auth'

interface ProtectedRouteProps {
  allowedRoles: string[]
  children: ReactNode
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    const fetchSession = async () => {
      // 1. Check cached stored role first (e.g. admin login or session cache)
      const storedRole = getStoredRole()
      if (storedRole && allowedRoles.includes(storedRole)) {
        setIsAllowed(true)
        setSessionLoaded(true)
        return
      }

      // 2. Fallback to Supabase session & profiles check
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user
      if (!user) {
        setIsAllowed(false)
        setSessionLoaded(true)
        return
      }

      const cachedRole = getCachedUserRole(user.id)
      if (cachedRole && allowedRoles.includes(cachedRole)) {
        setIsAllowed(true)
        setSessionLoaded(true)
        return
      }

      const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (!error && profile && allowedRoles.includes(profile.role)) {
        setCachedUserRole(user.id, profile.role)
        setIsAllowed(true)
      } else {
        setIsAllowed(false)
      }
      setSessionLoaded(true)
    }

    fetchSession()
  }, [allowedRoles])

  if (!sessionLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!isAllowed) {
    if (allowedRoles.includes('admin')) {
      return <Navigate to="/admin/login" replace />
    }
    return <Navigate to="/auth" replace />
  }

  return <>{children}</>
}
