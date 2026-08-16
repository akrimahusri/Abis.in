const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ihytgezouztyvnimblfk.supabase.co';
const supabaseAnonKey = 'sb_publishable_KDBf4U5QEh8STsKfrbXnnw_aBpLQpha';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('--- Postingan Makanan ---');
  const { data: posts, error: postsErr } = await supabase.from('postingan_makanan').select('*');
  console.log('Posts:', JSON.stringify(posts, null, 2), 'Error:', postsErr);

  console.log('--- Transaksi Pembelian ---');
  const { data: txs, error: txsErr } = await supabase.from('transaksi_pembelian').select('*');
  console.log('Transactions:', JSON.stringify(txs, null, 2), 'Error:', txsErr);

  console.log('--- Profiles ---');
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('*');
  console.log('Profiles:', JSON.stringify(profiles, null, 2), 'Error:', profErr);
}

main();
