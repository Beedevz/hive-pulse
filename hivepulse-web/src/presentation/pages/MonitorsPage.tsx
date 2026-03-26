import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useCreateMonitor, useUpdateMonitor, useDeleteMonitor } from '../../application/useMonitors'
import { LeftPanel } from '../components/LeftPanel'
import { StatsBar } from '../components/StatsBar'
import { MonitorDetailSection } from '../components/MonitorDetailSection'
import { MonitorModal } from '../components/MonitorModal'
import type { Monitor, CreateMonitorPayload } from '../../domain/monitor'

export function MonitorsPage() {
  const { id: selectedMonitorId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const createMonitor = useCreateMonitor()
  const updateMonitor = useUpdateMonitor()
  const deleteMonitor = useDeleteMonitor()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingMonitor, setEditingMonitor] = useState<Monitor | undefined>()

  const handleAdd = () => {
    setEditingMonitor(undefined)
    setModalOpen(true)
  }

  const handleEdit = (monitor: Monitor) => {
    setEditingMonitor(monitor)
    setModalOpen(true)
  }

  const handleDelete = (id: string) => {
    deleteMonitor.mutate(id, {
      onSuccess: () => navigate('/dashboard'),
    })
  }

  const handleModalSubmit = (payload: CreateMonitorPayload) => {
    if (editingMonitor) {
      updateMonitor.mutate({ id: editingMonitor.id, payload }, { onSuccess: () => setModalOpen(false) })
    } else {
      createMonitor.mutate(payload, { onSuccess: () => setModalOpen(false) })
    }
  }

  const showLeft = !isMobile || !selectedMonitorId
  const showRight = !isMobile || !!selectedMonitorId

  return (
    <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>
      {showLeft && (
        <LeftPanel
          selectedMonitorId={selectedMonitorId ?? null}
          onAddClick={handleAdd}
        />
      )}

      {showRight && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <StatsBar />
          {selectedMonitorId ? (
            <MonitorDetailSection
              key={selectedMonitorId}
              monitorId={selectedMonitorId}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.4,
              }}
            >
              <Typography fontSize="1.75rem" sx={{ mb: 1 }}>◈</Typography>
              <Typography fontSize="0.6875rem" color="text.secondary">
                Select a monitor to view details
              </Typography>
            </Box>
          )}
        </Box>
      )}

      <MonitorModal
        key={editingMonitor?.id ?? `new-${modalOpen}`}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialValues={editingMonitor}
        error={(updateMonitor.error ?? createMonitor.error)?.message ?? null}
      />
    </Box>
  )
}
