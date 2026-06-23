import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardCheck, LogOut, Activity, Shield
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/assess', label: 'New Assessment', icon: ClipboardCheck },
]

export default function Layout({ onLogout }) {
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-navy-900 flex flex-col shadow-2xl z-10">
        {/* Brand */}
        <div className="px-6 py-6 border-b border-navy-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold-500 rounded-lg flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-navy-900" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">CreditPulse</h1>
              <p className="text-navy-300 text-xs font-medium">MSME Assessment</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gold-500/20 text-gold-400 shadow-inner'
                    : 'text-navy-300 hover:bg-navy-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-navy-700">
          <div className="flex items-center gap-3 px-4 py-2 mb-3">
            <div className="w-8 h-8 bg-navy-700 rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-gold-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">RM Admin</p>
              <p className="text-navy-400 text-xs">IDBI Bank</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-2.5 w-full text-navy-400 hover:text-red-400 hover:bg-navy-800 rounded-lg text-sm transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-navy-50">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
