import { useState, useRef, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { colors } from '../../shared/colors'
import { useMonitors } from '../../application/useMonitors'
import { useTags, useMonitorTagsMap } from '../../application/useTags'
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
  const [activeTagId, setActiveTagId] = useState<string | null>(null)
  const selectedItemRef = useRef<HTMLDivElement>(null)
  const { data: monitorsData } = useMonitors(1, 1000)
  const { data: tags = [] } = useTags()
  const monitors = monitorsData?.data ?? []
  const monitorIds = monitors.map((m) => m.id)
  const tagMap = useMonitorTagsMap(activeTagId ? monitorIds : [])

  const filtered = monitors
    .filter((m) => matchesSearch(m, searchTerm))
    .filter((m) => !activeTagId || (tagMap[m.id] ?? []).some((t) => t.id === activeTagId))

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
        width: 480,
        flexShrink: 0,
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        backdropFilter: 'blur(8px)',
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
            color: 'background.default',
            borderRadius: 0.5,
            '&:hover': { bgcolor: colors.accentGlow },
          }}
        >
          + Add
        </Button>
      </Box>

      {/* Search + Tag filter */}
      <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0, display: 'flex', gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <MonitorSearch onSearch={setSearchTerm} />
        </Box>
        {tags.length > 0 && (
          <Select
            value={activeTagId ?? ''}
            onChange={(e) => setActiveTagId(e.target.value || null)}
            size="small"
            displayEmpty
            sx={{ fontSize: '0.75rem', minWidth: 120 }}
          >
            <MenuItem value=""><em>All tags</em></MenuItem>
            {tags.map((tag) => (
              <MenuItem key={tag.id} value={tag.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tag.color, flexShrink: 0 }} />
                  {tag.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
        )}
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
