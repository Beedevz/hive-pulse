import { NavLink } from 'react-router-dom'
import { useMe } from '../../application/useAuth'
import { Logo } from './Logo'

export function Sidebar() {
  const { data: user } = useMe()
  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-4"><Logo /></div>
      <nav className="flex-1 px-2 space-y-1">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `block px-3 py-2 rounded ${isActive ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
        >
          Dashboard
        </NavLink>
        {user?.role !== 'viewer' && (
          <NavLink
            to="/settings"
            className={({ isActive }) => `block px-3 py-2 rounded ${isActive ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
          >
            Settings
          </NavLink>
        )}
      </nav>
      <div className="p-4 text-sm text-gray-400">{user?.email}</div>
    </aside>
  )
}
