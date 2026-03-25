import { forwardRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { colors } from '../../shared/colors'
import { useHeartbeats } from '../../application/useMonitors'
import { UptimeBar } from './UptimeBar'
import type { Monitor } from '../../domain/monitor'

function getStatusColor(status: string, isDark: boolean): string {
  const map: Record<string, [string, string]> = {
    up:       [colors.up,   colors.upL],
    down:     [colors.down, colors.downL],
    unknown:  [colors.darkTextTertiary, colors.lightTextTertiary],
  }
  const pair = map[status] ?? [colors.darkTextTertiary, colors.lightTextTertiary]
  return isDark ? pair[0] : pair[1]
}

interface MonitorListItemProps {
  monitor: Monitor
  isSelected: boolean
}

export const MonitorListItem = forwardRef<HTMLDivElement, MonitorListItemProps>(
  function MonitorListItem({ monitor, isSelected }, ref) {
    const navigate = useNavigate()
    const theme = useTheme()
    const isDark = theme.palette.mode === 'dark'
    const statusColor = getStatusColor(monitor.last_status, isDark)

    const { data: hbData } = useHeartbeats(monitor.id)
    const heartbeats = hbData?.data ?? []
    const blocks = heartbeats.length > 0
      ? heartbeats.map((h) => h.status as 'up' | 'down' | 'unknown')
      : new Array(48).fill('unknown' as const)
    const avgPing = heartbeats.length > 0
      ? Math.round(heartbeats.reduce((s, h) => s + h.ping_ms, 0) / heartbeats.length)
      : null

    const subLabel = `${monitor.check_type.toUpperCase()} · ${monitor.interval}s`
      + (avgPing !== null ? ` · avg ${avgPing}ms` : '')

    return (
      <Box
        ref={ref}
        onClick={() => navigate(`/monitors/${monitor.id}`)}
        sx={{
          borderRadius: 1,
          border: '1px solid',
          borderColor: isSelected
            ? `${statusColor}40`
            : monitor.last_status === 'down'
            ? 'rgba(248,113,113,0.2)'
            : 'divider',
          borderLeft: `2px solid ${statusColor}`,
          bgcolor: monitor.last_status === 'down'
            ? 'rgba(248,113,113,0.05)'
            : isSelected
            ? `${statusColor}10`
            : 'background.paper',
          px: 1.5,
          py: 1.25,
          cursor: 'pointer',
          '&:hover': { borderColor: `${statusColor}60` },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.375 }}>
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              bgcolor: statusColor,
              flexShrink: 0,
              boxShadow: monitor.last_status !== 'unknown' ? `0 0 5px ${statusColor}88` : 'none',
            }}
          />
          <Typography fontSize="0.75rem" fontWeight={600} color="text.primary" noWrap sx={{ flex: 1 }}>
            {monitor.name}
          </Typography>
          <Typography fontSize="0.6875rem" fontWeight={700} color={statusColor} sx={{ flexShrink: 0 }}>
            {(monitor.uptime_24h * 100).toFixed(1)}%
          </Typography>
        </Box>

        <Typography fontSize="0.625rem" color="text.secondary" noWrap sx={{ mb: 0.5 }}>
          {subLabel}
        </Typography>

        <Box sx={{ height: 5, overflow: 'hidden' }}>
          <UptimeBar blocks={blocks} />
        </Box>
      </Box>
    )
  }
)
