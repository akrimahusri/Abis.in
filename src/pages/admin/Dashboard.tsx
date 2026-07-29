export default function AdminDashboard() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-3xl font-semibold">Dashboard Admin</h1>
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Ringkasan Angka</h2>
          <p className="mt-2 text-slate-600">Tampilkan statistik, antrean verifikasi, dan moderasi.</p>
        </section>
      </div>
    </main>
  )
}
