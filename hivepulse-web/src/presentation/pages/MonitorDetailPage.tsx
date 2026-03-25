import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { useMonitor } from '../../application/useMonitors'
import { useStats } from '../../application/useStats'
import { useMe } from '../../application/useAuth'
import { useMonitorChannels, useChannels, useAssignChannel, useUnassignChannel } from '../../application/useNotifications'
import { UptimeHeatmap } from '../components/UptimeHeatmap'
import { ResponseTimeChart } from '../components/ResponseTimeChart'
import { Sidebar } from '../components/Sidebar'
import type { StatsRange } from '../../domain/stats'

const statusChipColor = (status: string) => {
  switch (status) {
    case 'up':          return 'success' as const
    case 'down':        return 'error'   as const
    case 'slow':
    case 'degraded':    return 'warning' as const
    case 'maintenance': return 'info'    as const
    default:            return 'default' as const
  }
}

function MonitorChannelsSection({ monitorId }: Readonly<{ monitorId: string }>) {
  const { data: assigned = [] } = useMonitorChannels(monitorId)
  const { data: allChannels = [] } = useChannels()
  const assign = useAssignChannel()
  const unassign = useUnassignChannel()
  const [selectedChannelId, setSelectedChannelId] = useState('')

  const handleAdd = () => {
    if (!selectedChannelId) return
    assign.mutate({ monitorId, channelId: selectedChannelId })
    setSelectedChannelId('')
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>Notification Channels</Typography>
      {assigned.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Using global channels
        </Typography>
      ) : (
        assigned.map((ch) => (
          <Box key={ch.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography>{ch.name} ({ch.type})</Typography>
            <Button size="small" color="error" onClick={() => unassign.mutate({ monitorId, channelId: ch.id })}>
              Remove
            </Button>
          </Box>
        ))
      )}
      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <Select
          size="small"
          value={selectedChannelId}
          onChange={(e) => setSelectedChannelId(e.target.value)}
          displayEmpty
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Add Override Channel</MenuItem>
          {allChannels.map((ch) => (
            <MenuItem key={ch.id} value={ch.id}>{ch.name}</MenuItem>
          ))}
        </Select>
        <Button onClick={handleAdd} disabled={!selectedChannelId} variant="outlined" size="small">
          Add
        </Button>
      </Box>
    </Box>
  )
}

export function MonitorDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const [chartRange, setChartRange] = useState<'24h' | '7d'>('24h')
  const { data: me } = useMe()

  const { data: monitor, isLoading: monitorLoading, isError: monitorError } = useMonitor(id)
  const { data: heatmapStats, isLoading: heatmapLoading, isError: heatmapError } = useStats(id, '90d')
  const { data: chartStats, isLoading: chartLoading, isError: chartError } = useStats(id, chartRange as StatsRange)

  if (monitorLoading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Box>
    )
  }

  if (monitorError || !monitor) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <Box sx={{ flex: 1, p: 4 }}>
          <Alert severity="error">Monitor not found or failed to load.</Alert>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 4, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={600} color="text.primary" fontSize="1.0625rem">
            {monitor.name}
          </Typography>
          <Chip
            label={monitor.last_status.toUpperCase()}
            color={statusChipColor(monitor.last_status)}
            size="small"
            sx={{ fontSize: '0.6875rem', fontWeight: 700, height: 22 }}
          />
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, px: 4, py: 3 }}>
          {/* Uptime Heatmap */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight={600} color="text.primary" sx={{ mb: 1.5 }}>
              Uptime — last 90 days
            </Typography>
            {heatmapLoading && <CircularProgress size={24} />}
            {heatmapError && <Alert severity="error">Failed to load uptime data.</Alert>}
            {heatmapStats && <UptimeHeatmap buckets={heatmapStats.buckets} />}
          </Box>

          {/* Response Time Chart */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} color="text.primary" sx={{ mb: 1 }}>
              Response Time
            </Typography>
            <Tabs
              value={chartRange}
              onChange={(_, v) => setChartRange(v)}
              sx={{ mb: 2, minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5 } }}
            >
              <Tab label="24h" value="24h" />
              <Tab label="7d" value="7d" />
            </Tabs>
            {chartLoading && <CircularProgress size={24} />}
            {chartError && <Alert severity="error">Failed to load response time data.</Alert>}
            {chartStats && <ResponseTimeChart buckets={chartStats.buckets} range={chartRange} />}
          </Box>

          {me?.role === 'admin' && id && (
            <MonitorChannelsSection monitorId={id} />
          )}
        </Box>
      </Box>
    </Box>
  )
}
