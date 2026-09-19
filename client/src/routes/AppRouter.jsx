import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage        from '../pages/landing/LandingPage'
import LoginPage          from '../pages/auth/LoginPage'
import RegisterPage       from '../pages/auth/RegisterPage'
import DashboardLayout    from '../components/layout/DashboardLayout'
import OverviewPage       from '../pages/dashboard/OverviewPage'
import DocumentsPage      from '../pages/dashboard/DocumentsPage'
import DocumentDetailPage from '../pages/dashboard/DocumentDetailPage'
import UploadPage         from '../pages/dashboard/UploadPage'
import TransactionsPage   from '../pages/dashboard/TransactionsPage'
import RisksPage          from '../pages/dashboard/RisksPage'
import VendorsPage        from '../pages/dashboard/VendorsPage'
import AnalyticsPage      from '../pages/dashboard/AnalyticsPage'
import AIAssistantPage    from '../pages/dashboard/AIAssistantPage'
import SettingsPage       from '../pages/dashboard/SettingsPage'
import ProtectedRoute     from './ProtectedRoute'

function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 text-center px-4">
      <p className="text-7xl font-black text-primary-600 mb-4">404</p>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Page Not Found</h1>
      <p className="text-gray-400 mb-6">The page you're looking for doesn't exist.</p>
      <a href="/" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">Back to Home</a>
    </div>
  )
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"         element={<LandingPage />} />
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index                  element={<OverviewPage />} />
        <Route path="documents"       element={<DocumentsPage />} />
        <Route path="documents/:id"   element={<DocumentDetailPage />} />
        <Route path="upload"          element={<UploadPage />} />
        <Route path="transactions"    element={<TransactionsPage />} />
        <Route path="risks"           element={<RisksPage />} />
        <Route path="vendors"         element={<VendorsPage />} />
        <Route path="analytics"       element={<AnalyticsPage />} />
        <Route path="ai"              element={<AIAssistantPage />} />
        <Route path="settings"        element={<SettingsPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
