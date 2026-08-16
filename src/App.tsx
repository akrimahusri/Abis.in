import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import PenjualDashboard from './pages/penjual/Dashboard'
import PenjualProfile from './pages/penjual/Profile'
import PenjualPostingForm from './pages/penjual/PostingForm'
import PenjualHistory from './pages/penjual/History'
import PembeliDashboard from './pages/pembeli/Dashboard'
import PembeliCart from './pages/pembeli/Keranjang'
import PembeliRiwayat from './pages/pembeli/Riwayat'
import PembeliDetail from './pages/pembeli/Detail'
import PeternakRiwayat from './pages/peternak/Riwayat'
import PeternakProfil from './pages/peternak/Profil'
import PeternakDashboard from './pages/peternak/Dashboard'
import PeternakDetail from './pages/peternak/Detail'
import PeternakKonfirmasi from './pages/peternak/Konfirmasi'
import PeternakExplore from './pages/peternak/Explore'
import AdminDashboard from './pages/admin/Dashboard'
import AdminLogin from './pages/admin/AdminLogin'
import AdminVerifikasiMitra from './pages/admin/VerifikasiMitra'
import AdminManajemenWilayah from './pages/admin/ManajemenWilayah'
import AdminModerasiLaporan from './pages/admin/ModerasiLaporan'
import AdminManajemenPengguna from './pages/admin/ManajemenPengguna'
import AdminLogAuditKeamanan from './pages/admin/LogAuditKeamanan'
import AdminKebijakanPrivasi from './pages/admin/KebijakanPrivasi'
import Navbar from './components/Navbar'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/penjual"
          element={<ProtectedRoute allowedRoles={['penjual']}><PenjualDashboard /></ProtectedRoute>}
        />
        <Route
          path="/penjual/postingan"
          element={<ProtectedRoute allowedRoles={['penjual']}><PenjualPostingForm /></ProtectedRoute>}
        />
        <Route
          path="/penjual/profile"
          element={<ProtectedRoute allowedRoles={['penjual']}><PenjualProfile /></ProtectedRoute>}
        />
        <Route
          path="/penjual/dompet"
          element={<ProtectedRoute allowedRoles={['penjual']}><PenjualHistory /></ProtectedRoute>}
        />
        <Route
          path="/penjual/*"
          element={<ProtectedRoute allowedRoles={['penjual']}><PenjualDashboard /></ProtectedRoute>}
        />
        <Route
          path="/pembeli/keranjang"
          element={<ProtectedRoute allowedRoles={['pembeli']}><PembeliCart /></ProtectedRoute>}
        />
        <Route
          path="/pembeli/riwayat"
          element={<ProtectedRoute allowedRoles={['pembeli']}><PembeliRiwayat /></ProtectedRoute>}
        />
        <Route
          path="/pembeli/detail"
          element={<ProtectedRoute allowedRoles={['pembeli']}><PembeliDetail /></ProtectedRoute>}
        />
        <Route
          path="/pembeli/*"
          element={<ProtectedRoute allowedRoles={['pembeli']}><PembeliDashboard /></ProtectedRoute>}
        />
        <Route
          path="/peternak/riwayat"
          element={<ProtectedRoute allowedRoles={['peternak']}><PeternakRiwayat /></ProtectedRoute>}
        />
        <Route
          path="/peternak/profil"
          element={<ProtectedRoute allowedRoles={['peternak']}><PeternakProfil /></ProtectedRoute>}
        />
        <Route
          path="/peternak/profile"
          element={<ProtectedRoute allowedRoles={['peternak']}><PeternakProfil /></ProtectedRoute>}
        />
        <Route
          path="/peternak/detail/:id"
          element={<ProtectedRoute allowedRoles={['peternak']}><PeternakDetail /></ProtectedRoute>}
        />
        <Route
          path="/peternak/konfirmasi/:id"
          element={<ProtectedRoute allowedRoles={['peternak']}><PeternakKonfirmasi /></ProtectedRoute>}
        />
        <Route
          path="/peternak/explore"
          element={<ProtectedRoute allowedRoles={['peternak']}><PeternakExplore /></ProtectedRoute>}
        />
        <Route
          path="/peternak/*"
          element={<ProtectedRoute allowedRoles={['peternak']}><PeternakDashboard /></ProtectedRoute>}
        />
        <Route
          path="/admin/verifikasi"
          element={<ProtectedRoute allowedRoles={['admin']}><AdminVerifikasiMitra /></ProtectedRoute>}
        />
        <Route
          path="/admin/wilayah"
          element={<ProtectedRoute allowedRoles={['admin']}><AdminManajemenWilayah /></ProtectedRoute>}
        />
        <Route
          path="/admin/moderasi"
          element={<ProtectedRoute allowedRoles={['admin']}><AdminModerasiLaporan /></ProtectedRoute>}
        />
        <Route
          path="/admin/pengguna"
          element={<ProtectedRoute allowedRoles={['admin']}><AdminManajemenPengguna /></ProtectedRoute>}
        />
        <Route
          path="/admin/audit"
          element={<ProtectedRoute allowedRoles={['admin']}><AdminLogAuditKeamanan /></ProtectedRoute>}
        />
        <Route
          path="/admin/kebijakan"
          element={<ProtectedRoute allowedRoles={['admin']}><AdminKebijakanPrivasi /></ProtectedRoute>}
        />
        <Route
          path="/admin/dashboard"
          element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>}
        />
        <Route
          path="/admin"
          element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>}
        />
        <Route
          path="/admin/*"
          element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
