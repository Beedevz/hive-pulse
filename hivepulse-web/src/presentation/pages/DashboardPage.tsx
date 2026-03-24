import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Pagination from '@mui/material/Pagination'
import AddIcon from '@mui/icons-material/Add'
import { useMonitors, useCreateMonitor, useUpdateMonitor, useDeleteMonitor } from '../../application/useMonitors'
import { useMe } from '../../application/useAuth'
import { useWebSocket } from '../../application/useWebSocket'
import { MonitorCard } from '../components/MonitorCard'
import { MonitorSearch } from '../components/MonitorSearch'
import { MonitorModal } from '../components/MonitorModal'
import { Sidebar } from '../components/Sidebar'
import type { Monitor, CreateMonitorPayload } from '../../domain/monitor'

const PAGE_SIZE = 20

function matchesSearch(m: Monitor, term: string): boolean {
  if (!term) return true
  const t = term.toLowerCase()
  return (
    m.name.toLowerCase().includes(t) ||
    (m.url ?? '').toLowerCase().includes(t) ||
    (m.host ?? '').toLowerCase().includes(t) ||
    (m.ping_host ?? '').toLowerCase().includes(t) ||
    (m.dns_host ?? '').toLowerCase().includes(t)
  )
}

export function DashboardPage() {
  useWebSocket()

  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Monitor | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading } = useMonitors(page, PAGE_SIZE)
  const { data: me } = useMe()
  const createMutation = useCreateMonitor()
  const updateMutation = useUpdateMonitor()
  const deleteMutation = useDeleteMonitor()

  const allMonitors = data?.data ?? []
  const upCount      = allMonitors.filter((m) => m.last_status === 'up').length
  const downCount    = allMonitors.filter((m) => m.last_status === 'down').length
  const unknownCount = allMonitors.filter((m) => m.last_status === 'unknown').length
  const filtered     = allMonitors.filter((m) => matchesSearch(m, searchTerm))
  const totalPages   = Math.ceil((data?.total ?? 0) / PAGE_SIZE)

  function handleSubmit(payload: CreateMonitorPayload) {
    if (editTarget) {
      updateMutation.mutate(
        { id: editTarget.id, payload },
        { onSuccess: () => { setModalOpen(false); setEditTarget(null) } }
      )
    } else {
      createMutation.mutate(payload, { onSuccess: () => setModalOpen(false) })
    }
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 4, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box>
            <Typography variant="h6" fontWeight={600} color="text.primary" fontSize="1.0625rem">
              Monitors
            </Typography>
            <Typography variant="body2" color="text.secondary" fontSize="0.8125rem">
              {allMonitors.length} total
              {downCount > 0 && <Box component="span" sx={{ color: 'error.main', ml: 1 }}>· {downCount} down</Box>}
            </Typography>
          </Box>
          {me?.role !== 'viewer' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              size="small"
              onClick={() => { setEditTarget(null); setModalOpen(true) }}
            >
              Add Monitor
            </Button>
          )}
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 3, px: 4, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <StatChip color="#4ade80" label="Up"      value={upCount} />
          <StatChip color="#f87171" label="Down"    value={downCount} />
          <StatChip color="#4b5563" label="Unknown" value={unknownCount} />
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, px: 4, py: 3 }}>
          <Box sx={{ mb: 2.5, maxWidth: 500 }}>
            <MonitorSearch onSearch={setSearchTerm} />
          </Box>

          {isLoading && (
            <Typography color="text.secondary" fontSize="0.875rem">Loading monitors…</Typography>
          )}

          {!isLoading && filtered.length === 0 && (
            <EmptyState
              hasSearch={!!searchTerm}
              canAdd={me?.role !== 'viewer'}
              onAdd={() => { setEditTarget(null); setModalOpen(true) }}
            />
          )}

          {!isLoading && filtered.length > 0 && (
            <Box>
              {filtered.map((m) => (
                <MonitorCard
                  key={m.id}
                  monitor={m}
                  currentUserRole={me?.role ?? 'viewer'}
                  onEdit={(mon) => { setEditTarget(mon); setModalOpen(true) }}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </Box>
          )}

          {totalPages > 1 && (
            <Box sx={{ mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, p) => setPage(p)}
                size="small"
                sx={{ '& .MuiPaginationItem-root': { color: 'text.secondary' } }}
              />
            </Box>
          )}
        </Box>
      </Box>

      <MonitorModal
        key={editTarget?.id ?? 'new'}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null) }}
        onSubmit={handleSubmit}
        initialValues={editTarget ?? undefined}
      />
    </Box>
  )
}

function StatChip({ color, label, value }: Readonly<{ color: string; label: string; value: number }>) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
      <Typography fontSize="0.875rem" color="text.secondary">{label}</Typography>
      <Typography fontSize="0.875rem" fontWeight={600} color="text.primary">{value}</Typography>
    </Box>
  )
}

function EmptyState({ hasSearch, canAdd, onAdd }: Readonly<{ hasSearch: boolean; canAdd: boolean; onAdd: () => void }>) {
  if (hasSearch) {
    return <Typography color="text.secondary" fontSize="0.875rem">No monitors match your search.</Typography>
  }
  return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Typography color="text.secondary" sx={{ mb: 2 }}>No monitors yet.</Typography>
      {canAdd && (
        <Chip label="Add your first monitor" onClick={onAdd} color="primary" variant="outlined" clickable />
      )}
    </Box>
  )
}
