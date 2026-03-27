import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { colors } from '../../shared/colors'
import { useMonitors } from '../../application/useMonitors'
import { useIncidents } from '../../application/useIncidents'

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

  const monitors = monitorsData?.data ?? []
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
