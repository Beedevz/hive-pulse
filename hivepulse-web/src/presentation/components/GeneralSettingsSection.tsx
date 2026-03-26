// hivepulse-web/src/presentation/components/GeneralSettingsSection.tsx
import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import { useGeneralSettings, useSaveGeneralSettings } from '../../application/useSettings'

const TIMEZONES = Intl.supportedValuesOf('timeZone')

export function GeneralSettingsSection() {
  const { data: settings } = useGeneralSettings()
  const save = useSaveGeneralSettings()
  const [timezone, setTimezone] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (settings) setTimezone(settings.timezone)
  }, [settings])

  const handleSave = () => {
    save.mutate({ timezone }, {
      onSuccess: () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      },
    })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 480 }}>
      <Typography variant="subtitle1" fontWeight={600}>General</Typography>
      <Box>
        <Typography fontSize="0.75rem" color="text.secondary" mb={0.5}>Timezone</Typography>
        <Select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          size="small"
          fullWidth
          inputProps={{ 'aria-label': 'timezone' }}
        >
          {TIMEZONES.map((tz) => (
            <MenuItem key={tz} value={tz}>{tz}</MenuItem>
          ))}
        </Select>
      </Box>
      <Box>
        <Button variant="contained" size="small" onClick={handleSave} disabled={save.isPending}>
          Save
        </Button>
      </Box>
      <Snackbar open={saved} message="Settings saved" autoHideDuration={3000} onClose={() => setSaved(false)} />
    </Box>
  )
}
