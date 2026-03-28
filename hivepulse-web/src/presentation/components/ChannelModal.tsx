import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Switch from '@mui/material/Switch'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import type { NotificationChannel, CreateChannelInput, ChannelType } from '../../domain/notification'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (input: CreateChannelInput) => void
  channel?: NotificationChannel
  defaultType?: ChannelType
}

export function ChannelModal({ open, onClose, onSubmit, channel, defaultType = 'email' }: Readonly<Props>) {
  const [name, setName] = useState(channel?.name ?? '')
  const [type, setType] = useState<ChannelType>(channel?.type ?? defaultType)
  const [isGlobal, setIsGlobal] = useState(channel?.is_global ?? false)
  const [enabled, setEnabled] = useState(channel?.enabled ?? true)
  const [remindInterval, setRemindInterval] = useState(String(channel?.remind_interval_min ?? 0))

  const [emailTo, setEmailTo] = useState(channel?.type === 'email' ? (channel.config.to ?? '') : '')
  const [webhookUrl, setWebhookUrl] = useState(channel?.type === 'webhook' ? (channel.config.url ?? '') : '')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [slackUrl, setSlackUrl] = useState(channel?.type === 'slack' ? (channel.config.webhook_url ?? '') : '')

  function handleSubmit() {
    const config: Record<string, string> = {}

    if (type === 'email') {
      if (emailTo) config.to = emailTo
    } else if (type === 'webhook') {
      if (webhookUrl && webhookUrl !== '***') config.url = webhookUrl
      if (webhookSecret) config.secret = webhookSecret
    } else if (type === 'slack') {
      if (slackUrl && slackUrl !== '***') config.webhook_url = slackUrl
    }

    onSubmit({
      name,
      type,
      config,
      is_global: isGlobal,
      enabled,
      remind_interval_min: Number(remindInterval),
    })
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{channel ? 'Edit Channel' : 'Add Channel'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            fullWidth
            slotProps={{ htmlInput: { 'aria-label': 'Name' } }}
          />
          <TextField
            select
            label="Type"
            value={type}
            onChange={e => setType(e.target.value as ChannelType)}
            fullWidth
          >
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="webhook">Webhook</MenuItem>
            <MenuItem value="slack">Slack</MenuItem>
          </TextField>

          {type === 'email' && (
            <TextField
              label="To"
              value={emailTo}
              onChange={e => setEmailTo(e.target.value)}
              fullWidth
              slotProps={{ htmlInput: { 'aria-label': 'To' } }}
            />
          )}

          {type === 'webhook' && (
            <>
              <TextField
                label="URL"
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                fullWidth
                slotProps={{ htmlInput: { 'aria-label': 'URL' } }}
              />
              <TextField
                label="Secret"
                type="password"
                value={webhookSecret}
                onChange={e => setWebhookSecret(e.target.value)}
                fullWidth
                placeholder={channel?.config.secret ? '••••••••' : ''}
                slotProps={{ htmlInput: { 'aria-label': 'Secret' } }}
              />
            </>
          )}

          {type === 'slack' && (
            <TextField
              label="Webhook URL"
              type="password"
              value={slackUrl}
              onChange={e => setSlackUrl(e.target.value)}
              fullWidth
              placeholder={channel?.config.webhook_url ? '••••••••' : ''}
              slotProps={{ htmlInput: { 'aria-label': 'Webhook URL' } }}
            />
          )}

          <TextField
            label="Remind Interval (minutes)"
            type="number"
            value={remindInterval}
            onChange={e => setRemindInterval(e.target.value)}
            fullWidth
            slotProps={{ htmlInput: { 'aria-label': 'Remind Interval (minutes)', min: 0 } }}
          />

          <FormControlLabel
            control={<Checkbox checked={isGlobal} onChange={e => setIsGlobal(e.target.checked)} />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                Global channel
                <Tooltip title="Global channels fire for all monitors that don't have a specific channel override assigned. Uncheck to use this channel only when explicitly assigned to a monitor.">
                  <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                </Tooltip>
              </Box>
            }
          />

          <FormControlLabel
            control={<Switch checked={enabled} onChange={e => setEnabled(e.target.checked)} />}
            label="Enabled"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}
