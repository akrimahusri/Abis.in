import { ReactNode, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface ProtectedRouteProps {
  allowedRoles: string[]
  children: ReactNode
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user
      if (!user) {
        setSessionLoaded(true)
        setIsAllowed(false)
        return
      }

      const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (!error && profile && allowedRoles.includes(profile.role)) {
        setIsAllowed(true)
      }
      setSessionLoaded(true)
    }

    fetchSession()
  }, [allowedRoles])

  if (!sessionLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!isAllowed) {
    return <Navigate to="/auth" replace />
  }

  return <>{children}</>
}
