import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import { useTheme } from '@mui/material/styles'
import type { Monitor } from '../../domain/monitor'
import { useHeartbeats } from '../../application/useMonitors'
import { UptimeBar } from './UptimeBar'
import { colors } from '../../shared/colors'

interface MonitorCardProps {
  monitor: Monitor
  currentUserRole: string
  onEdit: (m: Monitor) => void
  onDelete: (id: string) => void
}

function getStatusColors(status: string, isDark: boolean) {
  const upColor      = isDark ? colors.up   : colors.upL
  const downColor    = isDark ? colors.down : colors.downL
  const slowColor    = isDark ? colors.slow : colors.slowL
  const maintColor   = isDark ? colors.blue : colors.blueL
  const unknownColor = isDark ? colors.darkTextTertiary : colors.lightTextTertiary
  const map = {
    up:          { border: upColor,      dot: upColor,      glow: `${upColor}b0`,      chip: 'success' as const },
    down:        { border: downColor,    dot: downColor,    glow: `${downColor}b0`,    chip: 'error'   as const },
    slow:        { border: slowColor,    dot: slowColor,    glow: `${slowColor}b0`,    chip: 'warning' as const },
    degraded:    { border: slowColor,    dot: slowColor,    glow: `${slowColor}b0`,    chip: 'warning' as const },
    maintenance: { border: maintColor,   dot: maintColor,   glow: `${maintColor}b0`,   chip: 'info'    as const },
    unknown:     { border: unknownColor, dot: unknownColor, glow: 'none',              chip: 'default' as const },
  }
  return map[status as keyof typeof map] ?? map.unknown
}

function Sparkline({ pings, color }: Readonly<{ pings: number[]; color: string }>) {
  const gradId = useId()
  const w = 600
  const h = 48

  if (pings.length < 2) {
    return <svg width="100%" height={h} />
  }

  const max = Math.max(...pings, 1)
  const coords = pings.map((p, i) => ({
    x: (i / (pings.length - 1)) * w,
    y: h - (p / max) * (h - 4) - 2,
  }))

  const linePts = coords.map(({ x, y }) => `${x},${y}`).join(' ')
  const areaPath =
    `M ${coords[0].x},${coords[0].y} ` +
    coords.slice(1).map(({ x, y }) => `L ${x},${y}`).join(' ') +
    ` L ${coords.at(-1)!.x},${h} L ${coords[0].x},${h} Z`

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <polyline points={linePts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

export function MonitorCard({ monitor, currentUserRole, onEdit, onDelete }: Readonly<MonitorCardProps>) {
  const navigate = useNavigate()
  const theme = useTheme()
  const sc = getStatusColors(monitor.last_status, theme.palette.mode === 'dark')
  const prevStatusRef = useRef(monitor.last_status)
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    if (prevStatusRef.current !== 'down' && monitor.last_status === 'down') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShaking(true)
      const t = setTimeout(() => setShaking(false), 400)
      return () => clearTimeout(t)
    }
    prevStatusRef.current = monitor.last_status
  }, [monitor.last_status])

  const { data: hbData } = useHeartbeats(monitor.id)
  const heartbeats = hbData?.data ?? []
  const blocks = heartbeats.length > 0
    ? heartbeats.map((h) => h.status as 'up' | 'down' | 'slow' | 'unknown')
    : new Array(48).fill('unknown' as const)
  const sparklinePings = heartbeats.slice(-48).map((h) => h.ping_ms)
  const avgPing = heartbeats.length > 0
    ? Math.round(heartbeats.reduce((s, h) => s + h.ping_ms, 0) / heartbeats.length)
    : null
  const subLabel = monitor.url ?? monitor.host ?? monitor.ping_host ?? monitor.dns_host ?? ''

  return (
    <Box
      onClick={() => navigate(`/monitors/${monitor.id}`)}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: `3px solid ${sc.border}`,
        bgcolor: 'background.paper',
        p: '12px 16px',
        mb: 1,
        cursor: 'pointer',
        animation: shaking ? 'shake 0.4s ease-in-out' : undefined,
        transition: 'border-color 0.3s cubic-bezier(0.23,1,0.32,1), box-shadow 0.3s cubic-bezier(0.23,1,0.32,1), transform 0.3s cubic-bezier(0.23,1,0.32,1)',
        '&:hover': {
          borderColor: `${sc.border}40`,
          borderLeftColor: sc.border,
          boxShadow: `0 4px 20px rgba(0,0,0,0.18)`,
          transform: 'translateY(-2px)',
        },
      }}
    >
      {/* Top row: info left, badge right */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
          <Box sx={{
            width: 9, height: 9, borderRadius: '50%', flexShrink: 0, mt: '2px',
            bgcolor: sc.dot, boxShadow: `0 0 7px ${sc.glow}`,
            animation: monitor.last_status !== 'up' && monitor.last_status !== 'unknown'
              ? 'statusPulse 1.5s ease-in-out infinite'
              : undefined,
            '@keyframes statusPulse': {
              '0%, 100%': { opacity: 1 },
              '50%':       { opacity: 0.3 },
            },
          }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography fontSize="0.9375rem" fontWeight={600} color="text.primary" noWrap>
              {monitor.name}
            </Typography>
            {subLabel && (
              <Typography fontSize="0.8125rem" color="text.secondary" noWrap sx={{ mt: 0.25 }}>
                {subLabel}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0, ml: 2 }}>
          <Typography fontSize="0.8125rem" color="text.secondary">
            {monitor.check_type.toUpperCase()} · {monitor.interval}s
            {avgPing !== null && ` · avg ${avgPing}ms`}
          </Typography>
          <Chip
            label={monitor.last_status.toUpperCase()}
            color={sc.chip}
            size="small"
            sx={{ fontSize: '0.6875rem', fontWeight: 700, height: 22, minWidth: 44 }}
          />
        </Box>
      </Box>

      {/* UptimeBar + percentage */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Box sx={{ flex: 1 }}>
          <UptimeBar blocks={blocks} />
        </Box>
        <Typography fontSize="0.8125rem" fontWeight={700} color={sc.border} sx={{ flexShrink: 0, minWidth: 44, textAlign: 'right' }}>
          {(monitor.uptime_24h * 100).toFixed(1)}%
        </Typography>
      </Box>

      {/* Sparkline with gradient fill */}
      <Box sx={{ color: sc.border, mb: currentUserRole !== 'viewer' ? 1.5 : 0 }}>
        <Sparkline pings={sparklinePings} color={sc.border} />
      </Box>

      {/* Actions */}
      {currentUserRole === 'viewer' ? null : (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button size="small" variant="outlined" onClick={() => onEdit(monitor)}
            sx={{ fontSize: '0.75rem', py: 0.25, borderColor: 'divider', color: 'text.secondary', '&:hover': { borderColor: 'text.disabled', color: 'text.primary' } }}>
            Edit
          </Button>
          <Button size="small" variant="outlined" color="error"
            onClick={() => { if (globalThis.confirm('Delete monitor?')) onDelete(monitor.id) }}
            sx={{ fontSize: '0.75rem', py: 0.25 }}>
            Delete
          </Button>
        </Box>
      )}
    </Box>
  )
}
