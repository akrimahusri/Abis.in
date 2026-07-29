import { supabase } from './supabase'

export async function signUpUser(email: string, password: string) {
  return supabase.auth.signUp({ email, password })
}

export async function signInUser(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOutUser() {
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
