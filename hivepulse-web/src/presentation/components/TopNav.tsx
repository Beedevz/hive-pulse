import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useTheme } from '@mui/material/styles'
import { colors } from '../../shared/colors'
import { HivePulseLogo } from './Logo'
import { useMe, useLogout } from '../../application/useAuth'
import { useMonitors } from '../../application/useMonitors'

export function TopNav() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const { data: me } = useMe()
  const logout = useLogout()
  const navigate = useNavigate()
  const { data: monitorsData } = useMonitors(1, 1000)
  const monitors = monitorsData?.data ?? []
  const upCount = monitors.filter((m) => m.last_status === 'up').length
  const downCount = monitors.filter((m) => m.last_status === 'down').length
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const userInitial = (me?.email ?? '?')[0].toUpperCase()

  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 44,
        px: 2,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        flexShrink: 0,
        zIndex: 1200,
      }}
    >
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <HivePulseLogo size={28} />
        <Typography
          fontSize="0.9375rem"
          fontWeight={700}
          fontFamily="'Bricolage Grotesque', sans-serif"
          color="text.primary"
        >
          HivePulse
        </Typography>
      </Box>

      {/* Nav links */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {[
          { to: '/dashboard', label: 'Monitors' },
          { to: '/alerts',    label: 'Alerts' },
          { to: '/settings',  label: 'Settings' },
        ].map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              color: isActive ? colors.accentDark : theme.palette.text.secondary,
              background: isActive ? 'rgba(245,166,35,0.1)' : 'transparent',
              padding: '10px 12px',
              borderRadius: '4px 4px 0 0',
              fontSize: '0.8125rem',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
              borderBottom: isActive ? `2px solid ${colors.accentDark}` : '2px solid transparent',
            })}
          >
            {label}
          </NavLink>
        ))}
      </Box>

      {/* Right: status pill + avatar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Status pill */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            bgcolor: downCount > 0 ? 'rgba(248,113,113,0.08)' : 'rgba(74,222,128,0.08)',
            border: '1px solid',
            borderColor: downCount > 0 ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.2)',
            px: 1,
            py: 0.375,
            borderRadius: 10,
          }}
        >
          {(upCount > 0 || downCount === 0) && (
            <>
              <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: colors.up }} />
              <Typography fontSize="0.6875rem" fontWeight={600} color={colors.up}>
                {upCount} up
              </Typography>
            </>
          )}
          {upCount > 0 && downCount > 0 && (
            <Typography fontSize="0.6875rem" color="text.disabled" mx={0.25}>·</Typography>
          )}
          {downCount > 0 && (
            <>
              <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: colors.down }} />
              <Typography fontSize="0.6875rem" fontWeight={600} color={colors.down}>
                {downCount} down
              </Typography>
            </>
          )}
        </Box>

        {/* Avatar */}
        <Box
          onClick={(e) => setAnchorEl(e.currentTarget)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setAnchorEl(e.currentTarget as HTMLElement) }}
          role="button"
          tabIndex={0}
          aria-label="User menu"
          sx={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            bgcolor: colors.accentDark,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.625rem',
            fontWeight: 700,
            color: isDark ? colors.darkBg : '#fff',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          {userInitial}
        </Box>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          <MenuItem
            onClick={async () => {
              setAnchorEl(null)
              await logout.mutateAsync()
              navigate('/login')
            }}
          >
            Logout
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  )
}
