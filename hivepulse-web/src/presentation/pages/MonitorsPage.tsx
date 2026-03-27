import { useParams, useOutletContext } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { MonitorDetailSection } from '../components/MonitorDetailSection'
import type { DashboardOutletContext } from '../components/DashboardLayout'

export function MonitorsPage() {
  const { id: selectedMonitorId } = useParams<{ id: string }>()
  const { onEdit, onDelete } = useOutletContext<DashboardOutletContext>()

  if (!selectedMonitorId) {
    return (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
        <Typography fontSize="1.75rem" sx={{ mb: 1 }}>◈</Typography>
        <Typography fontSize="0.6875rem" color="text.secondary">
          Select a monitor to view details
        </Typography>
      </Box>
    )
  }

  return (
    <MonitorDetailSection
      key={selectedMonitorId}
      monitorId={selectedMonitorId}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}
