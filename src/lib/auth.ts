import { supabase } from './supabase'

const ROLE_CACHE_KEY = 'abis_in_role_cache'

export function setCachedUserRole(userId: string, role: string) {
  localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify({ userId, role }))
}

export function getCachedUserRole(userId: string) {
  const rawValue = localStorage.getItem(ROLE_CACHE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as { userId?: string; role?: string }
    if (parsed.userId === userId && typeof parsed.role === 'string') {
      return parsed.role
    }
  } catch {
    return null
  }

  return null
}

export function clearCachedUserRole() {
  localStorage.removeItem(ROLE_CACHE_KEY)
}

export async function signUpUser(email: string, password: string) {
  return supabase.auth.signUp({ email, password })
}

export async function signInUser(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOutUser() {
  clearCachedUserRole()
  return supabase.auth.signOut()
}

export async function getUserProfile() {
  const { data } = await supabase.auth.getSession()
  if (!data.session?.user) {
    return null
  }

  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', data.session.user.id).single()
  if (error) {
    throw error
  }

  return profile
}
