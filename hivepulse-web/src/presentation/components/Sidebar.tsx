import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Bell, Settings, LogOut, Activity } from 'lucide-react'
import { useMe, useLogout } from '../../application/useAuth'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/alerts',    icon: Bell,            label: 'Alerts' },
  { to: '/settings',  icon: Settings,        label: 'Settings', adminOnly: true },
]

export function Sidebar() {
  const { data: user } = useMe()
  const logout = useLogout()
  const navigate = useNavigate()

  function handleLogout() {
    logout.mutate(undefined, { onSuccess: () => { navigate('/login') } })
  }

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '??'

  return (
    <aside className="w-60 min-h-screen flex flex-col" style={{ background: '#0a0c10', borderRight: '1px solid #1f2937' }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom: '1px solid #1f2937' }}>
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          <Activity size={16} color="white" />
        </div>
        <span className="font-bold text-white text-base tracking-tight">HivePulse</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label, adminOnly }) => {
          if (adminOnly && user?.role === 'viewer') return null
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? 'text-white' : 'text-gray-500'} />
                  {label}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-3 pb-4 space-y-1" style={{ borderTop: '1px solid #1f2937', paddingTop: '12px' }}>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div
            className="flex items-center justify-center rounded-full flex-shrink-0 text-xs font-bold text-white"
            style={{ width: 30, height: 30, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-gray-200 truncate">{user?.name ?? user?.email}</div>
            <div className="text-xs text-gray-500 capitalize">{user?.role ?? 'viewer'}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-gray-800 w-full transition-colors"
        >
          <LogOut size={15} />
          Log out
        </button>
      </div>
    </aside>
  )
}
