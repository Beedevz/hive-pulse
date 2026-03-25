import { useState, useRef, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { colors } from '../../shared/colors'
import { useMonitors } from '../../application/useMonitors'
import { MonitorSearch } from './MonitorSearch'
import { MonitorListItem } from './MonitorListItem'
import type { Monitor } from '../../domain/monitor'

function matchesSearch(m: Monitor, term: string): boolean {
  if (!term) return true
  const t = term.toLowerCase()
  return (
    m.name.toLowerCase().includes(t) ||
    (m.url ?? '').toLowerCase().includes(t) ||
    (m.host ?? '').toLowerCase().includes(t) ||
    m.check_type.toLowerCase().includes(t)
  )
}

interface LeftPanelProps {
  selectedMonitorId: string | null
  onAddClick: () => void
}

export function LeftPanel({ selectedMonitorId, onAddClick }: Readonly<LeftPanelProps>) {
  const [searchTerm, setSearchTerm] = useState('')
  const selectedItemRef = useRef<HTMLDivElement>(null)
  const { data: monitorsData } = useMonitors(1, 1000)
  const monitors = monitorsData?.data ?? []
  const filtered = monitors.filter((m) => matchesSearch(m, searchTerm))

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({ behavior: 'instant', block: 'nearest' })
  }, [selectedMonitorId])

  const getRef = useCallback(
    (id: string) => (id === selectedMonitorId ? selectedItemRef : undefined),
    [selectedMonitorId]
  )

  return (
    <Box
      sx={{
        width: 380,
        flexShrink: 0,
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: colors.leftPanelBg,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.25,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography
            fontSize="0.6875rem"
            color="text.secondary"
            textTransform="uppercase"
            letterSpacing="0.08em"
          >
            Monitors
          </Typography>
          <Typography fontSize="0.6875rem" color="text.disabled">
            {monitors.length}
          </Typography>
        </Box>
        <Button
          size="small"
          onClick={onAddClick}
          sx={{
            fontSize: '0.75rem',
            fontWeight: 700,
            px: 1.25,
            py: 0.375,
            minWidth: 0,
            bgcolor: colors.accentDark,
            color: '#202232',
            borderRadius: 0.5,
            '&:hover': { bgcolor: colors.accentGlow },
          }}
        >
          + Add
        </Button>
      </Box>

      {/* Search */}
      <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <MonitorSearch onSearch={setSearchTerm} />
      </Box>

      {/* Monitor list */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 1.25, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {filtered.length === 0 && (
          <Typography fontSize="0.5625rem" color="text.disabled" textAlign="center" sx={{ mt: 2 }}>
            No monitors found
          </Typography>
        )}
        {filtered.map((monitor) => (
          <MonitorListItem
            key={monitor.id}
            ref={getRef(monitor.id)}
            monitor={monitor}
            isSelected={monitor.id === selectedMonitorId}
          />
        ))}
      </Box>
    </Box>
  )
}
