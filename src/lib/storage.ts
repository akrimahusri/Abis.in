import { supabase } from './supabase'

const BUCKET_NAME = 'foto-makanan'
export const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1548943487-a2e4e43b4859?w=500&h=400&fit=crop'

export async function uploadFoodImage(file: File, path: string) {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) {
    throw error
  }

  return data?.path || null
}

export function getFoodImageUrl(path: string) {
  return supabase.storage.from(BUCKET_NAME).getPublicUrl(path).data.publicUrl
}

export function resolveFoodImageUrl(fotoUrl: string | null | undefined, fallbackUrl?: string): string {
  const fallback = fallbackUrl || DEFAULT_FOOD_IMAGE
  if (!fotoUrl || typeof fotoUrl !== 'string' || !fotoUrl.trim()) {
    return fallback
  }

  const cleanUrl = fotoUrl.trim()
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('data:')) {
    return cleanUrl
  }

  return getFoodImageUrl(cleanUrl)
}

