import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Checkbox from '@mui/material/Checkbox'
import FormGroup from '@mui/material/FormGroup'
import { useUpdateAssignmentTriggers } from '../../application/useNotifications'
import { useGeneralSettings } from '../../application/useSettings'
import type { MonitorChannelAssignment, AssignmentTriggers, ScheduleRule } from '../../domain/notification'

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const DAY_LABELS: Record<string, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' }

interface Props {
  assignment: MonitorChannelAssignment
  monitorId: string
  open: boolean
  onClose: () => void
}

export function AssignmentTriggerModal({ assignment, monitorId, open, onClose }: Readonly<Props>) {
  const update = useUpdateAssignmentTriggers(monitorId)
  const { data: generalSettings } = useGeneralSettings()

  const initSchedule = assignment.triggers.schedule
  const [cooldown, setCooldown] = useState(String(assignment.triggers.cooldown_minutes))
  const [scheduleMode, setScheduleMode] = useState<'always' | 'custom'>(initSchedule ? 'custom' : 'always')
  const [days, setDays] = useState<string[]>(initSchedule?.days ?? ['mon', 'tue', 'wed', 'thu', 'fri'])
  const [start, setStart] = useState(initSchedule?.start ?? '09:00')
  const [end, setEnd] = useState(initSchedule?.end ?? '18:00')

  const toggleDay = (day: string) =>
    setDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day])

  const handleSave = () => {
    const schedule: ScheduleRule | undefined = scheduleMode === 'custom' ? { days, start, end } : undefined
    const triggers: AssignmentTriggers = { cooldown_minutes: Number(cooldown), schedule }
    update.mutate({ channelId: assignment.id, triggers }, { onSuccess: onClose })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit Rules — {assignment.name}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        <TextField
          label="Cooldown (minutes) — 0 disables"
          inputProps={{ 'aria-label': 'cooldown', type: 'number', min: 0 }}
          value={cooldown}
          onChange={(e) => setCooldown(e.target.value)}
          size="small"
          fullWidth
        />
        <Box>
          <Typography fontSize="0.75rem" color="text.secondary" mb={0.5}>Schedule</Typography>
          <RadioGroup value={scheduleMode} onChange={(_, v) => setScheduleMode(v as 'always' | 'custom')}>
            <FormControlLabel value="always" control={<Radio size="small" />} label="Always" />
            <FormControlLabel value="custom" control={<Radio size="small" inputProps={{ 'aria-label': 'Custom' }} />} label="Custom schedule" />
          </RadioGroup>
        </Box>
        {scheduleMode === 'custom' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <FormGroup row>
              {DAYS.map((d) => (
                <FormControlLabel
                  key={d}
                  control={<Checkbox size="small" checked={days.includes(d)} onChange={() => toggleDay(d)} />}
                  label={DAY_LABELS[d]}
                  sx={{ mr: 0.5 }}
                />
              ))}
            </FormGroup>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField label="Start" inputProps={{ 'aria-label': 'start', type: 'time' }} value={start} onChange={(e) => setStart(e.target.value)} size="small" />
              <TextField label="End" inputProps={{ 'aria-label': 'end', type: 'time' }} value={end} onChange={(e) => setEnd(e.target.value)} size="small" />
            </Box>
            {generalSettings && (
              <Typography fontSize="0.6875rem" color="text.disabled">
                Timezone: {generalSettings.timezone}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={update.isPending}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}
