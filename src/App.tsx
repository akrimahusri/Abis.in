import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import PenjualDashboard from './pages/penjual/Dashboard'
import PenjualPostingForm from './pages/penjual/PostingForm'
import PenjualHistory from './pages/penjual/History'
import PembeliExplore from './pages/pembeli/Explore'
import PembeliDetail from './pages/pembeli/Detail'
import PeternakDashboard from './pages/peternak/Dashboard'
import AdminDashboard from './pages/admin/Dashboard'
import Navbar from './components/Navbar'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/penjual/*"
          element={<ProtectedRoute allowedRoles={['penjual']}><PenjualDashboard /></ProtectedRoute>}
        />
        <Route
          path="/pembeli/*"
          element={<ProtectedRoute allowedRoles={['pembeli']}><PembeliExplore /></ProtectedRoute>}
        />
        <Route
          path="/peternak/*"
          element={<ProtectedRoute allowedRoles={['peternak']}><PeternakDashboard /></ProtectedRoute>}
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
