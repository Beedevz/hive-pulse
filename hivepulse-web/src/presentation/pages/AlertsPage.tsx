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
import { MonitorDetailSection } from '../components/MonitorDetailSection'

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

interface IncidentCardProps {
  inc: Incident
  selected: boolean
  onClick: () => void
}

function ActiveIncidentCard({ inc, selected, onClick }: Readonly<IncidentCardProps>) {
  return (
    <Box
      onClick={onClick}
      sx={{
        borderLeft: '3px solid #f87171',
        border: '1px solid',
        borderColor: selected ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.25)',
        borderLeftColor: '#f87171',
        borderLeftWidth: 3,
        borderRadius: 2,
        bgcolor: selected ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.04)',
        mb: 1.5,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'background 0.15s',
        '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: '1px solid rgba(239,68,68,0.12)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#f87171', boxShadow: '0 0 8px rgba(248,113,113,0.8)', flexShrink: 0 }} />
          <Typography fontWeight={600} color="text.primary" fontSize="0.875rem">{inc.monitor_name}</Typography>
          <Chip label="DOWN" size="small" color="error" sx={{ fontSize: '0.6875rem', fontWeight: 700, height: 20 }} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <AccessTimeIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
          <LiveDuration startedAt={inc.started_at} />
        </Box>
      </Box>
      {inc.error_msg && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, px: 2, py: 1, borderBottom: '1px solid rgba(239,68,68,0.08)' }}>
          <ErrorOutlineIcon sx={{ fontSize: 13, color: 'error.main', mt: 0.15, flexShrink: 0 }} />
          <Typography fontSize="0.8125rem" color="error.light">{inc.error_msg}</Typography>
        </Box>
      )}
      <Box sx={{ px: 2, py: 1 }}>
        <Typography fontSize="0.75rem" color="text.secondary">
          Started: <Box component="span" sx={{ color: 'text.primary' }}>{new Date(inc.started_at).toLocaleString()}</Box>
        </Typography>
      </Box>
    </Box>
  )
}

function ResolvedIncidentCard({ inc, selected, onClick }: Readonly<IncidentCardProps>) {
  return (
    <Box
      onClick={onClick}
      sx={{
        borderLeft: '3px solid #4ade80',
        border: '1px solid',
        borderColor: selected ? 'rgba(74,222,128,0.4)' : 'divider',
        borderLeftColor: '#4ade80',
        borderLeftWidth: 3,
        borderRadius: 2,
        bgcolor: selected ? 'rgba(74,222,128,0.06)' : 'background.paper',
        mb: 1.5,
        cursor: 'pointer',
        transition: 'background 0.15s',
        '&:hover': { bgcolor: 'rgba(74,222,128,0.06)' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 15, color: 'success.main', flexShrink: 0 }} />
          <Typography fontWeight={500} color="text.primary" fontSize="0.875rem">{inc.monitor_name}</Typography>
          <Chip label="RESOLVED" size="small" color="success" sx={{ fontSize: '0.6875rem', fontWeight: 700, height: 20 }} />
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography fontSize="0.8125rem" fontWeight={600} color="success.main">
            {formatDuration(inc.duration_s)}
          </Typography>
          <Typography fontSize="0.6875rem" color="text.secondary">
            {new Date(inc.started_at).toLocaleTimeString()} → {inc.resolved_at ? new Date(inc.resolved_at).toLocaleTimeString() : ''}
          </Typography>
        </Box>
      </Box>
      {inc.error_msg && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, pb: 1.25 }}>
          <ErrorOutlineIcon sx={{ fontSize: 13, color: 'text.secondary', flexShrink: 0 }} />
          <Typography fontSize="0.8125rem" color="text.secondary">{inc.error_msg}</Typography>
        </Box>
      )}
    </Box>
  )
}

export function AlertsPage() {
  const [filter, setFilter] = useState<IncidentFilter>('all')
  const [selectedMonitorId, setSelectedMonitorId] = useState<string | null>(null)
  const { data: activeData,   isLoading: loadingActive }   = useIncidents('active')
  const { data: resolvedData, isLoading: loadingResolved } = useIncidents('resolved')

  const activeIncidents   = activeData?.data ?? []
  const resolvedIncidents = resolvedData?.data ?? []
  const showActive   = filter === 'all' || filter === 'active'
  const showResolved = filter === 'all' || filter === 'resolved'
  const listFlex     = selectedMonitorId ? '0 0 380px' : 1

  const handleSelect = (monitorId: string) =>
    setSelectedMonitorId((prev) => (prev === monitorId ? null : monitorId))

  return (
    <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Incidents list */}
      <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: listFlex }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
          <Box>
            <Typography variant="h6" fontWeight={600} fontSize="1.0625rem">Alerts</Typography>
            <Typography fontSize="0.8125rem" color={activeIncidents.length > 0 ? 'error.main' : 'text.secondary'}>
              {activeIncidents.length > 0
                ? `${activeIncidents.length} active incident${activeIncidents.length > 1 ? 's' : ''}`
                : 'No active incidents'}
            </Typography>
          </Box>
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(_, v) => { if (v) setFilter(v) }}
            size="small"
            sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontSize: '0.75rem', px: 1.5, py: 0.5, color: 'text.secondary', borderColor: 'divider' } }}
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

        {/* List */}
        <Box sx={{ flex: 1, px: 3, py: 2.5, overflowY: 'auto' }}>
          {showActive && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <WarningAmberIcon sx={{ fontSize: 13, color: 'error.main' }} />
                <Typography fontSize="0.6875rem" fontWeight={700} color="error.main" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Active ({activeIncidents.length})
                </Typography>
              </Box>
              {loadingActive && <Typography color="text.secondary" fontSize="0.875rem">Loading…</Typography>}
              {!loadingActive && activeIncidents.length === 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 15, color: 'success.main' }} />
                  <Typography fontSize="0.875rem" color="text.secondary">All monitors are up.</Typography>
                </Box>
              )}
              {!loadingActive && activeIncidents.map((inc) => (
                <ActiveIncidentCard key={inc.id} inc={inc} selected={selectedMonitorId === inc.monitor_id} onClick={() => handleSelect(inc.monitor_id)} />
              ))}
            </Box>
          )}

          {showResolved && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 13, color: 'success.main' }} />
                <Typography fontSize="0.6875rem" fontWeight={700} color="success.main" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Resolved ({resolvedIncidents.length})
                </Typography>
              </Box>
              {loadingResolved && <Typography color="text.secondary" fontSize="0.875rem">Loading…</Typography>}
              {!loadingResolved && resolvedIncidents.length === 0 && (
                <Typography color="text.secondary" fontSize="0.875rem">No resolved incidents.</Typography>
              )}
              {!loadingResolved && resolvedIncidents.map((inc) => (
                <ResolvedIncidentCard key={inc.id} inc={inc} selected={selectedMonitorId === inc.monitor_id} onClick={() => handleSelect(inc.monitor_id)} />
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Right: monitor detail */}
      {selectedMonitorId ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderLeft: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <MonitorDetailSection key={selectedMonitorId} monitorId={selectedMonitorId} />
        </Box>
      ) : (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4, borderLeft: '1px solid', borderColor: 'divider' }}>
          <Typography fontSize="1.75rem" sx={{ mb: 1 }}>◈</Typography>
          <Typography fontSize="0.6875rem" color="text.secondary">Select an incident to view monitor details</Typography>
        </Box>
      )}
    </Box>
  )
}
