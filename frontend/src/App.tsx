import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Header from './components/Header'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import Catalog from './pages/Catalog'
import FillwordDetail from './pages/FillwordDetail'
import FillwordPDF from './pages/FillwordPDF'
import CreateFillword from './pages/CreateFillword'
import EditFillword from './pages/EditFillword'
import Profile from './pages/Profile'
import Moderation from './pages/Moderation'
import Login from './pages/Login'
import Register from './pages/Register'
import Leaderboard from './pages/Leaderboard'

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<Catalog />} />
              <Route path="/fillword/:id" element={<FillwordDetail />} />
              <Route path="/fillword/:id/pdf" element={<FillwordPDF />} />
              <Route path="/fillword/:id/edit" element={<ProtectedRoute roles={['user', 'admin']}><EditFillword /></ProtectedRoute>} />
              <Route path="/create" element={<ProtectedRoute roles={['user', 'admin']}><CreateFillword /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute roles={['user', 'admin']}><Profile /></ProtectedRoute>} />
              <Route path="/moderation" element={<ProtectedRoute roles={['admin']}><Moderation /></ProtectedRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  )
}