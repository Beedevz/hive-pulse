import { forwardRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { colors } from '../../shared/colors'
import { useHeartbeats } from '../../application/useMonitors'
import { useMonitorTags } from '../../application/useTags'
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

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  http:  { bg: '#1e3a5f', color: '#6BA3F7' },
  tcp:   { bg: '#2d1f5e', color: '#a78bfa' },
  ping:  { bg: '#1a3a2a', color: '#4ADE80' },
  dns:   { bg: '#3a2a1a', color: '#F5A623' },
}

function getSubLabel(m: Monitor): string {
  const interval = `${m.interval}s`
  switch (m.check_type) {
    case 'tcp':  return `${m.host}:${m.port} · ${interval}`
    case 'ping': return `${m.ping_host} · ${m.packet_count ?? 3}x · ${interval}`
    case 'dns':  return `${m.dns_host} · ${m.record_type} · ${interval}`
    default: {
      const base = `${m.url} · ${interval}`
      return m.expected_keyword ? `${base} · "${m.expected_keyword}"` : base
    }
  }
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
    const { data: tags = [] } = useMonitorTags(monitor.id)
    const heartbeats = hbData?.data ?? []
    const blocks = heartbeats.length > 0
      ? heartbeats.map((h) => h.status as 'up' | 'down' | 'unknown')
      : new Array(48).fill('unknown' as const)
    return (
      <Box
        ref={ref}
        onClick={() => navigate(`/monitor/${monitor.id}`)}
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

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Box
            component="span"
            sx={{
              fontSize: '0.625rem',
              fontWeight: 700,
              px: '5px',
              py: '1px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              letterSpacing: '0.5px',
              flexShrink: 0,
              mr: '5px',
              bgcolor: TYPE_COLORS[monitor.check_type]?.bg ?? '#1e2235',
              color:   TYPE_COLORS[monitor.check_type]?.color ?? '#94a3b8',
            }}
          >
            {monitor.check_type.toUpperCase()}
          </Box>
          <Typography fontSize="0.625rem" color="text.secondary" noWrap>
            {getSubLabel(monitor)}
          </Typography>
        </Box>

        <Box sx={{ height: 5, overflow: 'hidden' }}>
          <UptimeBar blocks={blocks} />
        </Box>

        {tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
            {tags.map((tag) => (
              <Box
                key={tag.id}
                sx={{
                  px: 0.75,
                  py: 0.125,
                  borderRadius: 0.5,
                  fontSize: '0.5625rem',
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                  bgcolor: `${tag.color}22`,
                  color: tag.color,
                  lineHeight: 1.6,
                }}
              >
                {tag.name}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    )
  }
)
