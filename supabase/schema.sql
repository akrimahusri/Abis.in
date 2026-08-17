-- Profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('penjual', 'pembeli', 'peternak', 'admin')),
  nama_usaha text,
  lokasi_lat numeric,
  lokasi_lng numeric,
  status_verifikasi text not null default 'pending',
  created_at timestamp with time zone default timezone('utc', now())
);

-- Postingan makanan
create table if not exists postingan_makanan (
  id uuid primary key default gen_random_uuid(),
  penjual_id uuid not null references profiles(id) on delete cascade,
  foto_url text,
  nama_makanan text not null,
  jumlah integer not null default 1,
  status text not null check (status in ('layak_jual','tidak_layak_konsumsi','terjual','diambil_maggot')),
  harga numeric not null default 0,
  batas_waktu_ambil timestamp with time zone,
  lokasi_lat numeric,
  lokasi_lng numeric,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Transaksi pembelian
create table if not exists transaksi_pembelian (
  id uuid primary key default gen_random_uuid(),
  postingan_id uuid not null references postingan_makanan(id) on delete cascade,
  pembeli_id uuid not null references profiles(id) on delete cascade,
  status text not null check (status in ('menunggu','terkonfirmasi','selesai','dibatalkan')),
  kode_konfirmasi text,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Pasokan maggot
create table if not exists pasokan_maggot (
  id uuid primary key default gen_random_uuid(),
  postingan_id uuid not null references postingan_makanan(id) on delete cascade,
  peternak_id uuid not null references profiles(id) on delete cascade,
  berat_estimasi numeric not null,
  berat_aktual numeric,
  harga_per_kg numeric not null,
  total_token numeric,
  status text not null check (status in ('menunggu','diterima','selesai')),
  created_at timestamp with time zone default timezone('utc', now())
);

-- Kapasitas peternak
create table if not exists kapasitas_peternak (
  id uuid primary key default gen_random_uuid(),
  peternak_id uuid not null references profiles(id) on delete cascade,
  kapasitas_harian_kg numeric not null,
  kapasitas_terpakai numeric not null default 0,
  tanggal date not null,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Laporan moderasi
create table if not exists laporan_moderasi (
  id uuid primary key default gen_random_uuid(),
  pelapor_id uuid not null references profiles(id) on delete cascade,
  terlapor_id uuid not null references profiles(id) on delete cascade,
  alasan text not null,
  status text not null check (status in ('open','diproses','selesai')),
  created_at timestamp with time zone default timezone('utc', now())
);

-- Policies
-- Enable RLS
alter table profiles enable row level security;
alter table postingan_makanan enable row level security;
alter table transaksi_pembelian enable row level security;
alter table pasokan_maggot enable row level security;
alter table kapasitas_peternak enable row level security;
alter table laporan_moderasi enable row level security;

-- Profiles policies
drop policy if exists "Admin can access profiles" on profiles;
create policy "Allow insert profile on registration" on profiles for insert with check (true);
create policy "Allow users select profiles" on profiles for select using (true);
create policy "Allow users update own profile" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Postingan policies
create policy "Penjual can modify own posting" on postingan_makanan for all using (
  auth.uid() = penjual_id or auth.role() = 'authenticated'
) with check (
  auth.uid() = penjual_id or auth.role() = 'authenticated'
);

create policy "Pembeli can view saleable postings" on postingan_makanan for select using (
  status = 'layak_jual' and auth.role() = 'authenticated'
);

create policy "Peternak can view non-consumable postings" on postingan_makanan for select using (
  status = 'tidak_layak_konsumsi' or auth.uid() = penjual_id
);

create policy "Admin can access all postings" on postingan_makanan for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin')) with check (true);

-- Transaksi policies
create policy "Create transaksi if authenticated" on transaksi_pembelian for insert using (auth.uid() is not null) with check (auth.uid() = pembeli_id);
create policy "Pembeli can view own transaksi" on transaksi_pembelian for select using (auth.uid() = pembeli_id);
create policy "Admin can access transaksi" on transaksi_pembelian for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin')) with check (true);

-- Pasokan policies
create policy "Peternak can access own pasokan" on pasokan_maggot for all using (auth.uid() = peternak_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin')) with check (auth.uid() = peternak_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Kapasitas peternak policies
create policy "Peternak can access own kapasitas" on kapasitas_peternak for all using (auth.uid() = peternak_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin')) with check (auth.uid() = peternak_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Laporan moderasi policies
create policy "User can create laporan" on laporan_moderasi for insert using (auth.uid() = pelapor_id) with check (auth.uid() = pelapor_id);
create policy "Admin can view laporan" on laporan_moderasi for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin')) with check (true);

-- Data location exposure rule note
-- Location latitude/longitude should be controlled in client queries and backend policies.
