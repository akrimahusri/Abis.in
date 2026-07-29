import { supabase } from './supabase'

const BUCKET_NAME = 'foto-makanan'

export async function uploadFoodImage(file: File, path: string) {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw error
  }

  return data?.path || null
}

export function getFoodImageUrl(path: string) {
  return supabase.storage.from(BUCKET_NAME).getPublicUrl(path).data.publicUrl
}
