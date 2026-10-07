import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { LayoutDashboard, List, Users, LogOut, Menu, ShieldCheck } from 'lucide-react'

export function Sidebar({ open, onClose }) {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>ElectSys</h1>
          <span>Election Platform</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-label">Main</div>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
              <LayoutDashboard size={16} /> Dashboard
            </NavLink>
            <NavLink to="/elections" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
              <List size={16} /> Elections
            </NavLink>
          </div>

          {isAdmin && (
            <div className="nav-section">
              <div className="nav-label">Admin</div>
              <NavLink to="/admin/elections" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <ShieldCheck size={16} /> Manage Elections
              </NavLink>
              <NavLink to="/admin/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <Users size={16} /> Manage Users
              </NavLink>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.firstName} {user?.lastName}</div>
              <div className="sidebar-user-role">{user?.role || 'voter'}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
    </>
  )
}

export function AppShell({ title, subtitle, actions, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            {title && <div className="topbar-title">{title}</div>}
            {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
          </div>
          {actions && <div className="topbar-right">{actions}</div>}
        </div>
        <div className="page-body">{children}</div>
      </div>
    </div>
  )
}
