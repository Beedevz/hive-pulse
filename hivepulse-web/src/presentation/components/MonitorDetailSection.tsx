import { useState } from 'react'
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
import type { ChannelType } from '../../domain/notification'
import { useMonitor, useHeartbeats } from '../../application/useMonitors'
import { useStats } from '../../application/useStats'
import { useMe } from '../../application/useAuth'
import { useMonitorChannels, useChannels, useAssignChannel, useUnassignChannel } from '../../application/useNotifications'
import { useMonitorTags, useTags, useAssignTag, useUnassignTag } from '../../application/useTags'
import Popover from '@mui/material/Popover'
import { UptimeHeatmap } from './UptimeHeatmap'
import { ResponseTimeChart } from './ResponseTimeChart'
import type { StatsRange } from '../../domain/stats'
import type { Monitor } from '../../domain/monitor'

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

const channelTypeLabel: Record<ChannelType, string> = {
  email: 'Email',
  webhook: 'Webhook',
  slack: 'Slack',
}

const channelTypeColor: Record<ChannelType, string> = {
  email: '#6BA3F7',
  webhook: '#FBBF24',
  slack: '#4ADE80',
}

function MonitorChannelsSection({ monitorId }: Readonly<{ monitorId: string }>) {
  const { data: assigned = [] } = useMonitorChannels(monitorId)
  const { data: allChannels = [] } = useChannels()
  const assign = useAssignChannel()
  const unassign = useUnassignChannel()
  const [selectedChannelId, setSelectedChannelId] = useState('')

  const assignedIds = new Set(assigned.map((ch) => ch.id))
  const unassigned = allChannels.filter((ch) => !assignedIds.has(ch.id))

  const handleAdd = () => {
    if (!selectedChannelId) return
    assign.mutate({ monitorId, channelId: selectedChannelId })
    setSelectedChannelId('')
  }

  return (
    <Box
      sx={{
        mt: 2.5,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        p: 2.5,
      }}
    >
      <Typography variant="subtitle1" fontWeight={600} color="text.primary" sx={{ mb: 1.5 }}>
        Notification Channels
      </Typography>

      {assigned.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'rgba(107,163,247,0.06)',
            border: '1px solid rgba(107,163,247,0.2)',
            borderRadius: 1,
            px: 1.5,
            py: 1,
            mb: 1.5,
          }}
        >
          <Typography fontSize="0.75rem" color="text.secondary">
            Using global channels — assign overrides below to customise alerts for this monitor.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
          {assigned.map((ch) => (
            <Chip
              key={ch.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box
                    sx={{
                      fontSize: '0.5625rem',
                      fontWeight: 700,
                      px: 0.75,
                      py: 0.125,
                      borderRadius: 0.5,
                      bgcolor: `${channelTypeColor[ch.type as ChannelType]}22`,
                      color: channelTypeColor[ch.type as ChannelType],
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {channelTypeLabel[ch.type as ChannelType] ?? ch.type}
                  </Box>
                  <Typography fontSize="0.75rem" fontWeight={500} color="text.primary">
                    {ch.name}
                  </Typography>
                </Box>
              }
              onDelete={() => unassign.mutate({ monitorId, channelId: ch.id })}
              size="small"
              sx={{
                height: 28,
                bgcolor: 'rgba(255,255,255,0.04)',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                '& .MuiChip-label': { px: 1 },
                '& .MuiChip-deleteIcon': { fontSize: 14, color: 'text.disabled', '&:hover': { color: 'error.main' } },
              }}
            />
          ))}
        </Box>
      )}

      {unassigned.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Select
            size="small"
            value={selectedChannelId}
            onChange={(e) => setSelectedChannelId(e.target.value)}
            displayEmpty
            sx={{
              fontSize: '0.75rem',
              minWidth: 220,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
            }}
          >
            <MenuItem value="" sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>
              Select a channel to assign…
            </MenuItem>
            {unassigned.map((ch) => (
              <MenuItem key={ch.id} value={ch.id} sx={{ fontSize: '0.75rem' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      fontSize: '0.5625rem',
                      fontWeight: 700,
                      px: 0.75,
                      py: 0.125,
                      borderRadius: 0.5,
                      bgcolor: `${channelTypeColor[ch.type as ChannelType]}22`,
                      color: channelTypeColor[ch.type as ChannelType],
                      textTransform: 'uppercase',
                    }}
                  >
                    {channelTypeLabel[ch.type as ChannelType] ?? ch.type}
                  </Box>
                  {ch.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
          <Button
            onClick={handleAdd}
            disabled={!selectedChannelId}
            variant="outlined"
            size="small"
            sx={{
              fontSize: '0.75rem',
              py: 0.625,
              borderColor: 'divider',
              color: 'text.secondary',
              '&:not(:disabled):hover': { borderColor: 'primary.main', color: 'primary.main' },
            }}
          >
            Assign
          </Button>
        </Box>
      )}
    </Box>
  )
}

interface MonitorDetailSectionProps {
  monitorId: string
  onEdit?: (monitor: Monitor) => void
  onDelete?: (id: string) => void
}

export function MonitorDetailSection({ monitorId, onEdit, onDelete }: Readonly<MonitorDetailSectionProps>) {
  const [chartRange, setChartRange] = useState<'24h' | '7d'>('24h')
  const [tagAnchor, setTagAnchor] = useState<null | HTMLElement>(null)
  const { data: me } = useMe()
  const { data: monitorTags = [] } = useMonitorTags(monitorId)
  const { data: allTags = [] } = useTags()
  const assignTag = useAssignTag()
  const unassignTag = useUnassignTag()
  const canEditTags = me?.role === 'admin' || me?.role === 'editor'

  const { data: monitor, isLoading: monitorLoading, isError: monitorError } = useMonitor(monitorId)
  const { data: hbData } = useHeartbeats(monitorId)
  const currentPing = hbData?.data?.[0]?.ping_ms ?? null
  const { data: stats24h } = useStats(monitorId, '24h')
  const { data: stats30d } = useStats(monitorId, '30d')
  const { data: heatmapStats, isLoading: heatmapLoading, isError: heatmapError } = useStats(monitorId, '90d')
  const { data: chartStats, isLoading: chartLoading, isError: chartError } = useStats(monitorId, chartRange as StatsRange)

  if (monitorLoading) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (monitorError || !monitor) {
    return (
      <Box sx={{ flex: 1, p: 4 }}>
        <Alert severity="error">Monitor not found or failed to load.</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'auto' }}>
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
        {monitorTags.map((t) => (
          <Chip
            key={t.id}
            label={t.name}
            size="small"
            onDelete={canEditTags ? () => unassignTag.mutate({ monitorId, tagId: t.id }) : undefined}
            sx={{ bgcolor: `${t.color}22`, color: t.color, fontSize: '0.625rem' }}
          />
        ))}
        {canEditTags && (
          <>
            <Button size="small" sx={{ fontSize: '0.625rem', minWidth: 0, px: 0.75 }} onClick={(e) => setTagAnchor(e.currentTarget)}>
              + Tag
            </Button>
            <Popover open={Boolean(tagAnchor)} anchorEl={tagAnchor} onClose={() => setTagAnchor(null)}>
              <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 160 }}>
                {allTags.filter((t) => !monitorTags.some((mt) => mt.id === t.id)).map((t) => (
                  <Chip
                    key={t.id}
                    label={t.name}
                    size="small"
                    onClick={() => { assignTag.mutate({ monitorId, tagId: t.id }); setTagAnchor(null) }}
                    sx={{ bgcolor: `${t.color}22`, color: t.color, cursor: 'pointer' }}
                  />
                ))}
                {allTags.length === 0 && <Typography fontSize="0.75rem" color="text.secondary">No tags available.</Typography>}
              </Box>
            </Popover>
          </>
        )}
        {me?.role !== 'viewer' && (
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => onEdit?.(monitor)}
              sx={{ fontSize: '0.75rem', py: 0.25, borderColor: 'divider', color: 'text.secondary' }}
            >
              Edit
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => {
                if (globalThis.confirm('Delete monitor?')) onDelete?.(monitor.id)
              }}
              sx={{ fontSize: '0.75rem', py: 0.25 }}
            >
              Delete
            </Button>
          </Box>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, px: 4, py: 3 }}>
        {/* Stats summary row */}
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            mb: 2.5,
            flexWrap: 'wrap',
          }}
        >
          {[
            {
              label: 'Current Ping',
              value: currentPing === null ? '—' : `${currentPing}ms`,
            },
            {
              label: 'Avg Ping (24h)',
              value: stats24h ? `${stats24h.avg_ping_ms}ms` : '—',
            },
            {
              label: 'Uptime (24h)',
              value: `${(monitor.uptime_24h * 100).toFixed(2)}%`,
            },
            {
              label: 'Uptime (30d)',
              value: stats30d ? `${stats30d.uptime_pct.toFixed(2)}%` : '—',
            },
            {
              label: 'Uptime (90d)',
              value: heatmapStats ? `${heatmapStats.uptime_pct.toFixed(2)}%` : '—',
            },
          ].map(({ label, value }) => (
            <Box
              key={label}
              sx={{
                flex: '1 1 120px',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1.5,
                px: 2,
                py: 1.5,
                minWidth: 100,
              }}
            >
              <Typography fontSize="0.625rem" color="text.secondary" textTransform="uppercase" letterSpacing="0.06em" mb={0.5}>
                {label}
              </Typography>
              <Typography fontSize="1.125rem" fontWeight={700} color="text.primary" fontFamily="'IBM Plex Mono', monospace">
                {value}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Uptime Heatmap */}
        <Box
          sx={{
            mb: 2.5,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1.5,
            p: 2.5,
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} color="text.primary" sx={{ mb: 1.5 }}>
            Uptime — last 90 days
          </Typography>
          {heatmapLoading && <CircularProgress size={24} />}
          {heatmapError && <Alert severity="error">Failed to load uptime data.</Alert>}
          {heatmapStats && <UptimeHeatmap buckets={heatmapStats.buckets} />}
        </Box>

        {/* Response Time Chart */}
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1.5,
            p: 2.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={600} color="text.primary">
              Response Time
            </Typography>
            <Tabs
              value={chartRange}
              onChange={(_, v) => setChartRange(v)}
              sx={{ minHeight: 32, '& .MuiTab-root': { minHeight: 32, py: 0, px: 1.5, fontSize: '0.75rem' } }}
            >
              <Tab label="24h" value="24h" />
              <Tab label="7d" value="7d" />
            </Tabs>
          </Box>
          {chartLoading && <CircularProgress size={24} />}
          {chartError && <Alert severity="error">Failed to load response time data.</Alert>}
          {chartStats && <ResponseTimeChart buckets={chartStats.buckets} range={chartRange} />}
        </Box>

        {me?.role === 'admin' && monitorId && (
          <MonitorChannelsSection monitorId={monitorId} />
        )}
      </Box>
    </Box>
  )
}
