import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { useIncidents } from '../../application/useIncidents'
import type { IncidentFilter } from '../../application/useIncidents'
import type { Incident } from '../../domain/incident'

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function LiveDuration({ startedAt }: Readonly<{ startedAt: string }>) {
  const [secs, setSecs] = useState(
    () => Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
  )
  useEffect(() => {
    const t = setInterval(() => {
      setSecs(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
    }, 1000)
    return () => clearInterval(t)
  }, [startedAt])
  return (
    <Typography component="span" fontFamily="monospace" fontWeight={700} fontSize="0.8125rem" color="error.main">
      {formatDuration(secs)}
    </Typography>
  )
}

function ActiveIncidentCard({ inc }: Readonly<{ inc: Incident }>) {
  return (
    <Box
      sx={{
        borderLeft: '3px solid #f87171',
        border: '1px solid rgba(239,68,68,0.25)',
        borderLeftColor: '#f87171',
        borderLeftWidth: 3,
        borderRadius: 2,
        bgcolor: 'rgba(239,68,68,0.04)',
        mb: 1.5,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: '1px solid rgba(239,68,68,0.12)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#f87171', boxShadow: '0 0 8px rgba(248,113,113,0.8)', flexShrink: 0 }} />
          <Typography fontWeight={600} color="text.primary" fontSize="0.9375rem">{inc.monitor_name}</Typography>
          <Chip label="DOWN" size="small" color="error" sx={{ fontSize: '0.6875rem', fontWeight: 700, height: 20 }} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
          <AccessTimeIcon sx={{ fontSize: 14 }} />
          <Typography fontSize="0.8125rem" color="text.secondary">Ongoing:</Typography>
          <LiveDuration startedAt={inc.started_at} />
        </Box>
      </Box>

      {/* Error message */}
      {inc.error_msg && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, px: 2, py: 1.25, borderBottom: '1px solid rgba(239,68,68,0.08)' }}>
          <ErrorOutlineIcon sx={{ fontSize: 15, color: 'error.main', mt: 0.1, flexShrink: 0 }} />
          <Typography fontSize="0.875rem" color="error.light" fontWeight={500}>{inc.error_msg}</Typography>
        </Box>
      )}

      {/* Meta */}
      <Box sx={{ px: 2, py: 1.25 }}>
        <Typography fontSize="0.8125rem" color="text.secondary">
          Started: <Box component="span" sx={{ color: 'text.primary' }}>{new Date(inc.started_at).toLocaleString()}</Box>
        </Typography>
      </Box>
    </Box>
  )
}

function ResolvedIncidentCard({ inc }: Readonly<{ inc: Incident }>) {
  return (
    <Box
      sx={{
        borderLeft: '3px solid #4ade80',
        border: '1px solid',
        borderColor: 'divider',
        borderLeftColor: '#4ade80',
        borderLeftWidth: 3,
        borderRadius: 2,
        bgcolor: 'background.paper',
        mb: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 16, color: 'success.main', flexShrink: 0 }} />
          <Typography fontWeight={500} color="text.primary" fontSize="0.9375rem">{inc.monitor_name}</Typography>
          <Chip label="RESOLVED" size="small" color="success" sx={{ fontSize: '0.6875rem', fontWeight: 700, height: 20 }} />
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography fontSize="0.8125rem" fontWeight={600} color="success.main">
            Downtime: {formatDuration(inc.duration_s)}
          </Typography>
          <Typography fontSize="0.75rem" color="text.secondary">
            {new Date(inc.started_at).toLocaleTimeString()} → {inc.resolved_at ? new Date(inc.resolved_at).toLocaleTimeString() : ''}
          </Typography>
        </Box>
      </Box>
      {inc.error_msg && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, pb: 1.5 }}>
          <ErrorOutlineIcon sx={{ fontSize: 13, color: 'text.secondary', flexShrink: 0 }} />
          <Typography fontSize="0.8125rem" color="text.secondary">{inc.error_msg}</Typography>
        </Box>
      )}
    </Box>
  )
}

export function AlertsPage() {
  const [filter, setFilter] = useState<IncidentFilter>('all')
  const { data: activeData,   isLoading: loadingActive }   = useIncidents('active')
  const { data: resolvedData, isLoading: loadingResolved } = useIncidents('resolved')

  const activeIncidents   = activeData?.data ?? []
  const resolvedIncidents = resolvedData?.data ?? []
  const showActive   = filter === 'all' || filter === 'active'
  const showResolved = filter === 'all' || filter === 'resolved'

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 4, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box>
            <Typography variant="h6" fontWeight={600} color="text.primary" fontSize="1.0625rem">Alerts</Typography>
            <Typography variant="body2" fontSize="0.8125rem">
              {activeIncidents.length > 0
                ? <Box component="span" sx={{ color: 'error.main' }}>{activeIncidents.length} active incident{activeIncidents.length > 1 ? 's' : ''}</Box>
                : <Box component="span" sx={{ color: 'text.secondary' }}>No active incidents</Box>
              }
            </Typography>
          </Box>

          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(_, v) => { if (v) setFilter(v) }}
            size="small"
            sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontSize: '0.8125rem', px: 2, py: 0.75, color: 'text.secondary', borderColor: 'divider' } }}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="active" aria-label="Active">
              Active
              {activeIncidents.length > 0 && (
                <Chip label={activeIncidents.length} size="small" color="error" sx={{ ml: 0.75, height: 18, fontSize: '0.6875rem', fontWeight: 700 }} />
              )}
            </ToggleButton>
            <ToggleButton value="resolved" aria-label="Resolved">Resolved</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, px: 4, py: 3 }}>
          {showActive && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <WarningAmberIcon sx={{ fontSize: 15, color: 'error.main' }} />
                <Typography fontSize="0.75rem" fontWeight={700} color="error.main" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Active Incidents
                </Typography>
                <Typography fontSize="0.75rem" color="text.secondary">({activeIncidents.length})</Typography>
              </Box>

              {loadingActive && <Typography color="text.secondary" fontSize="0.875rem">Loading…</Typography>}

              {!loadingActive && activeIncidents.length === 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 15, color: 'success.main' }} />
                  <Typography fontSize="0.875rem" color="text.secondary">All monitors are up — no active incidents.</Typography>
                </Box>
              )}

              {!loadingActive && activeIncidents.map((inc) => (
                <ActiveIncidentCard key={inc.id} inc={inc} />
              ))}
            </Box>
          )}

          {showResolved && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 15, color: 'success.main' }} />
                <Typography fontSize="0.75rem" fontWeight={700} color="success.main" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Resolved
                </Typography>
                <Typography fontSize="0.75rem" color="text.secondary">({resolvedIncidents.length})</Typography>
              </Box>

              {loadingResolved && <Typography color="text.secondary" fontSize="0.875rem">Loading…</Typography>}

              {!loadingResolved && resolvedIncidents.length === 0 && (
                <Typography color="text.secondary" fontSize="0.875rem">No resolved incidents.</Typography>
              )}

              {!loadingResolved && resolvedIncidents.map((inc) => (
                <ResolvedIncidentCard key={inc.id} inc={inc} />
              ))}
            </Box>
          )}
        </Box>
    </Box>
  )
}
