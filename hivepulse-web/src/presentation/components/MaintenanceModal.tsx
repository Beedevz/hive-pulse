import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { useCreateMaintenance } from '../../application/useMaintenance'

interface MaintenanceModalProps {
  open: boolean
  onClose: () => void
  monitorId?: string
}

export function MaintenanceModal({ open, onClose, monitorId }: Readonly<MaintenanceModalProps>) {
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [reason, setReason] = useState('')
  const create = useCreateMaintenance()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    create.mutate(
      {
        ...(monitorId ? { monitor_id: monitorId } : {}),
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        reason,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{monitorId ? 'Schedule Maintenance' : 'Schedule Global Maintenance'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Start"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="End"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            required
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            size="small"
            placeholder="e.g. Server upgrade"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={!startsAt || !endsAt}>
            Schedule
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
