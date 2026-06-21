import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute, AdminRoute, PublicRoute } from './routes/Guards'

// Layouts
import DashboardLayout from './components/layout/DashboardLayout'

// Auth Pages
import Login from './pages/Auth/Login'
import Signup from './pages/Auth/Signup'
import ForgotPassword from './pages/Auth/ForgotPassword'
import ResetPassword from './pages/Auth/ResetPassword'

// Dashboard Pages
import Overview from './pages/Dashboard/Overview'
import MonitorList from './pages/Dashboard/MonitorList'
import MonitorDetail from './pages/Dashboard/MonitorDetail'
import AddMonitor from './pages/Dashboard/AddMonitor'
import EditMonitor from './pages/Dashboard/EditMonitor'

// Settings Pages
import ProfileSettings from './pages/Settings/ProfileSettings'
import BillingSettings from './pages/Settings/BillingSettings'

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard'
import UserManagement from './pages/Admin/UserManagement'

// Public
import PublicStatusPage from './pages/Status/PublicStatusPage'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/status/:slug" element={<PublicStatusPage />} />

          {/* Auth Routes — redirect to dashboard if logged in */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Protected App Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Overview />} />
              <Route path="/monitors" element={<MonitorList />} />
              <Route path="/monitors/new" element={<AddMonitor />} />
              <Route path="/monitors/:id" element={<MonitorDetail />} />
              <Route path="/monitors/:id/edit" element={<EditMonitor />} />
              <Route path="/settings/profile" element={<ProfileSettings />} />
              <Route path="/settings/billing" element={<BillingSettings />} />
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
            </Route>
          </Route>

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
