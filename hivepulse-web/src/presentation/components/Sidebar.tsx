import { useNavigate, useLocation, Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import DashboardIcon from '@mui/icons-material/Dashboard'
import NotificationsIcon from '@mui/icons-material/Notifications'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import { colors } from '../../shared/colors'
import { HivePulseLogo } from './Logo'
import { useMe, useLogout } from '../../application/useAuth'
import { useThemeMode } from '../../shared/themeStore'

const navItems = [
  { to: '/dashboard', icon: DashboardIcon,    label: 'Dashboard' },
  { to: '/alerts',    icon: NotificationsIcon, label: 'Alerts' },
  { to: '/settings',  icon: SettingsIcon,      label: 'Settings', adminOnly: true },
]

export function Sidebar() {
  const { data: user } = useMe()
  const logout  = useLogout()
  const navigate = useNavigate()
  const location = useLocation()
  const { mode, toggle } = useThemeMode()
  const isDark = mode === 'dark'

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '??'

  function handleLogout() {
    logout.mutate(undefined, { onSuccess: () => { navigate('/login') } })
  }

  return (
    <Box
      component="aside"
      sx={{
        width: 220,
        flexShrink: 0,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isDark ? colors.darkSidebar : colors.lightSidebar,
        borderRight: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Logo + theme toggle */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1.5,
        px: 2.5, py: 2.5,
        borderBottom: '1px solid', borderColor: 'divider',
      }}>
        <HivePulseLogo size={32} />
        <Typography fontWeight={700} fontSize={15} letterSpacing="-0.01em" sx={{ flex: 1, color: 'text.primary' }}>
          Hive<Box component="span" sx={{ color: 'primary.main' }}>Pulse</Box>
        </Typography>
        <Tooltip title={isDark ? 'Light mode' : 'Dark mode'}>
          <IconButton size="small" onClick={toggle}
            sx={{ color: 'primary.main', '&:hover': { color: 'primary.light' } }}>
            {isDark
              ? <LightModeIcon sx={{ fontSize: 17 }} />
              : <DarkModeIcon  sx={{ fontSize: 17 }} />
            }
          </IconButton>
        </Tooltip>
      </Box>

      {/* Nav */}
      <List sx={{ flex: 1, px: 1, py: 1.5 }} disablePadding>
        {navItems.map(({ to, icon: Icon, label, adminOnly }) => {
          if (adminOnly && user?.role === 'viewer') return null
          const active = location.pathname === to
          return (
            <ListItemButton
              key={to}
              component={Link}
              to={to}
              selected={active}
              sx={{
                borderRadius: 1, mb: 0.25, px: 1.5, py: 1,
                '&.Mui-selected': {
                  bgcolor: isDark ? 'rgba(245,166,35,0.07)' : 'rgba(200,144,0,0.06)',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(245,166,35,0.18)' : 'rgba(200,144,0,0.18)',
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(245,166,35,0.11)' : 'rgba(200,144,0,0.10)',
                  },
                  '& .MuiListItemIcon-root': { color: 'primary.main' },
                },
                '&:not(.Mui-selected)': { border: '1px solid transparent' },
                '&:not(.Mui-selected):hover': { bgcolor: 'action.hover' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: active ? 'primary.main' : 'text.secondary' }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={label}
                slotProps={{ primary: {
                  fontSize: '0.875rem',
                  fontWeight: active ? 600 : 500,
                  color: active ? 'primary.main' : 'text.secondary',
                }}}
              />
            </ListItemButton>
          )
        })}
      </List>

      {/* User section */}
      <Divider />
      <Box sx={{ px: 1.5, py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1, py: 0.75 }}>
          <Avatar sx={{
            width: 30, height: 30, fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
            background: `linear-gradient(135deg, ${colors.accentGlow}, #e8891c)`,
          }}>
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography fontSize="0.8125rem" fontWeight={500} color="text.primary" noWrap>
              {user?.name ?? user?.email}
            </Typography>
            <Typography fontSize="0.75rem" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
              {user?.role ?? 'viewer'}
            </Typography>
          </Box>
          <Tooltip title="Log out" placement="top">
            <IconButton size="small" onClick={handleLogout}
              sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary', bgcolor: 'action.hover' } }}>
              <LogoutIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  )
}
