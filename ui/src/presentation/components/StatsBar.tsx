import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { colors } from '../../shared/colors'
import { useMonitors } from '../../application/useMonitors'
import { useIncidents } from '../../application/useIncidents'
import { useOverviewStats } from '../../application/useStats'

function MiniSparkline({ data, color }: Readonly<{ data: number[]; color: string }>) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const h = 16
  const w = 80
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 2) - 1}`)
    .join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', marginTop: 4 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} opacity={0.6} />
    </svg>
  )
}

interface MetricCellProps {
  label: string
  value: string
  valueColor: string
  onClick?: () => void
  testId?: string
  valueTestId?: string
}

function MetricCell({ label, value, valueColor, onClick, testId, valueTestId }: Readonly<MetricCellProps>) {
  return (
    <Box
      data-testid={testId}
      onClick={onClick}
      sx={{
        flex: 1,
        px: 2,
        py: 1.25,
        borderRight: '1px solid',
        borderColor: 'divider',
        cursor: onClick ? 'pointer' : 'default',
        '&:last-child': { borderRight: 'none' },
        '&:hover': onClick ? { bgcolor: 'action.hover' } : {},
      }}
    >
      <Typography
        fontSize="0.5rem"
        color="text.secondary"
        textTransform="uppercase"
        letterSpacing="0.08em"
        sx={{ mb: 0.5 }}
      >
        {label}
      </Typography>
      <Typography
        data-testid={valueTestId}
        fontSize="1.25rem"
        fontWeight={700}
        color={valueColor}
      >
        {value}
      </Typography>
    </Box>
  )
}

export function StatsBar() {
  const navigate = useNavigate()
  const { data: monitorsData } = useMonitors(1, 1000)
  const { data: incidentsData } = useIncidents('active')
  const { data: overviewData } = useOverviewStats()

  const monitors = monitorsData?.data ?? []

  // Avg response: prefer WS-updated last_ping_ms from monitors cache, fallback to overview endpoint
  const monitorsWithPing = monitors.filter((m) => m.last_ping_ms != null && m.last_ping_ms > 0)
  const avgResponseMs = monitorsWithPing.length > 0
    ? Math.round(monitorsWithPing.reduce((s, m) => s + m.last_ping_ms!, 0) / monitorsWithPing.length)
    : overviewData?.avg_ping_ms ?? null
  const avgResponse = avgResponseMs === null ? '—' : `${avgResponseMs}ms`
  const sparklineData = overviewData?.buckets.map((b) => b.avg_ping_ms) ?? []
  const incidents = incidentsData?.data ?? []

  const avgUptime = monitors.length > 0
    ? (monitors.reduce((s, m) => s + m.uptime_24h, 0) / monitors.length * 100).toFixed(1) + '%'
    : '—'
  const downCount = monitors.filter((m) => m.last_status === 'down').length
  const incidentCount = incidents.length

  return (
    <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0, bgcolor: 'background.paper', backdropFilter: 'blur(8px)' }}>
      <MetricCell
        label="Avg Uptime"
        value={avgUptime}
        valueColor={colors.up}
        valueTestId="avg-uptime-value"
      />
      <Box
        sx={{
          flex: 1,
          px: 2,
          py: 1.25,
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography
          fontSize="0.5rem"
          color="text.secondary"
          textTransform="uppercase"
          letterSpacing="0.08em"
          sx={{ mb: 0.5 }}
        >
          Avg Response
        </Typography>
        <Typography
          data-testid="avg-response-value"
          fontSize="1.25rem"
          fontWeight={700}
          color={colors.accentDark}
        >
          {avgResponse}
        </Typography>
        <MiniSparkline data={sparklineData} color={colors.accentDark} />
      </Box>
      <MetricCell
        label="Monitors Down"
        value={String(downCount)}
        valueColor={downCount > 0 ? colors.down : 'text.secondary'}
      />
      <MetricCell
        label="Active Incidents"
        value={String(incidentCount)}
        valueColor={incidentCount > 0 ? colors.down : 'text.secondary'}
        onClick={() => navigate('/alerts')}
        testId="incidents-cell"
        valueTestId="incidents-value"
      />
      <MetricCell
        label="Total Monitors"
        value={String(monitors.length)}
        valueColor="text.primary"
        valueTestId="total-monitors-value"
      />
    </Box>
  )
}
