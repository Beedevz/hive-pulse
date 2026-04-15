import { useState } from 'react'
import { Outlet, useParams, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import { LeftPanel } from './LeftPanel'
import { StatsBar } from './StatsBar'
import { MonitorModal } from './MonitorModal'
import { useCreateMonitor, useUpdateMonitor, useDeleteMonitor } from '../../application/useMonitors'
import type { Monitor, CreateMonitorPayload } from '../../domain/monitor'

export interface DashboardOutletContext {
  onEdit: (monitor: Monitor) => void
  onDelete: (id: string) => void
}

export function DashboardLayout() {
  const { id: selectedMonitorId } = useParams<{ id: string }>()
  const navigate = useNavigate()

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
      onSuccess: () => { navigate('/monitor') },
    })
  }

  const handleModalSubmit = (payload: CreateMonitorPayload) => {
    if (editingMonitor) {
      updateMonitor.mutate({ id: editingMonitor.id, payload }, { onSuccess: () => setModalOpen(false) })
    } else {
      createMonitor.mutate(payload, { onSuccess: () => setModalOpen(false) })
    }
  }

  const context: DashboardOutletContext = { onEdit: handleEdit, onDelete: handleDelete }

  return (
    <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>
      {/* Fixed left panel */}
      <LeftPanel selectedMonitorId={selectedMonitorId ?? null} onAddClick={handleAdd} />

      {/* Right: StatsBar + route content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <StatsBar />
        <Outlet context={context} />
      </Box>

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
