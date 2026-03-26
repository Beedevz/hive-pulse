import { useState, useRef, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
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
        width: 380,
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

      {/* Search */}
      <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <MonitorSearch onSearch={setSearchTerm} />
      </Box>

      {/* Tag filters */}
      {tags.length > 0 && (
        <Box
          sx={{
            px: 1.5,
            py: 0.875,
            borderBottom: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.5,
          }}
        >
          {tags.map((tag) => {
            const active = activeTagId === tag.id
            return (
              <Box
                key={tag.id}
                onClick={() => setActiveTagId(active ? null : tag.id)}
                sx={{
                  px: 0.875,
                  py: 0.25,
                  borderRadius: 0.5,
                  fontSize: '0.5625rem',
                  fontWeight: 700,
                  letterSpacing: '0.03em',
                  cursor: 'pointer',
                  lineHeight: 1.6,
                  bgcolor: active ? tag.color : `${tag.color}22`,
                  color: active ? '#fff' : tag.color,
                  transition: 'all 0.15s',
                  '&:hover': { bgcolor: active ? tag.color : `${tag.color}44` },
                }}
              >
                {tag.name}
              </Box>
            )
          })}
        </Box>
      )}

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
