# Abis.in

Proyek React + Vite + TypeScript untuk platform Abis.in.

## Teknologi
- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Zustand
- Supabase (Auth, Database, Storage)
- Leaflet.js

## Setup
1. Copy `.env.example` ke `.env`
2. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`
3. Jalankan `npm install`
4. Jalankan `npm run dev`

## Struktur
- `src/lib/supabase.ts` untuk inisialisasi Supabase
- `src/pages` untuk halaman per role
- `src/components` untuk komponen bersama
- `supabase/schema.sql` untuk skema database dan RLS
