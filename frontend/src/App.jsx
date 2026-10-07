import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/ui/Toast'
import { ProtectedRoute, GuestRoute, AdminRoute } from './components/auth/RouteGuards'
import { LandingPage, LoginPage, RegisterPage } from './pages/AuthPages'
import { DashboardPage, ElectionsPage, ElectionDetailsPage } from './pages/ElectionPages'
import { AdminElectionsPage, ElectionFormPage, AdminUsersPage, AdminResultsPage } from './pages/admin/AdminPages'
import './App.css'
const protectedPage = page => <ProtectedRoute>{page}</ProtectedRoute>
const adminPage = page => <AdminRoute>{page}</AdminRoute>
export default function App() { return <BrowserRouter><AuthProvider><ToastProvider><Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
  <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
  <Route path="/dashboard" element={protectedPage(<DashboardPage />)} />
  <Route path="/elections" element={protectedPage(<ElectionsPage />)} />
  <Route path="/elections/:id" element={protectedPage(<ElectionDetailsPage />)} />
  <Route path="/vote/:id" element={protectedPage(<ElectionDetailsPage />)} />
  <Route path="/admin/elections" element={adminPage(<AdminElectionsPage />)} />
  <Route path="/admin/elections/new" element={adminPage(<ElectionFormPage />)} />
  <Route path="/admin/elections/:id/edit" element={adminPage(<ElectionFormPage />)} />
  <Route path="/admin/elections/:id/results" element={adminPage(<AdminResultsPage />)} />
  <Route path="/admin/users" element={adminPage(<AdminUsersPage />)} />
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes></ToastProvider></AuthProvider></BrowserRouter> }
