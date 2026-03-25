import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import type { CreateMonitorPayload, CheckType } from '../../domain/monitor'

interface MonitorModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: CreateMonitorPayload) => void
  initialValues?: Partial<CreateMonitorPayload>
}

export const MonitorModal = ({ open, onClose, onSubmit, initialValues }: Readonly<MonitorModalProps>) => {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [checkType, setCheckType] = useState<CheckType>(initialValues?.check_type ?? 'http')
  const [interval, setInterval] = useState(initialValues?.interval ?? 60)
  const [timeout, setTimeout] = useState(initialValues?.timeout ?? 30)
  const [retries, setRetries] = useState(initialValues?.retries ?? 0)
  const [retryInterval, setRetryInterval] = useState(initialValues?.retry_interval ?? 20)
  const [enabled, setEnabled] = useState(initialValues?.enabled ?? true)
  const [url, setUrl] = useState(initialValues?.url ?? '')
  const [method, setMethod] = useState(initialValues?.method ?? 'GET')
  const [expectedStatus, setExpectedStatus] = useState(initialValues?.expected_status ?? 200)
  const [followRedirects, setFollowRedirects] = useState(initialValues?.follow_redirects ?? true)
  const [host, setHost] = useState(initialValues?.host ?? '')
  const [port, setPort] = useState(initialValues?.port ?? 80)
  const [pingHost, setPingHost] = useState(initialValues?.ping_host ?? '')
  const [packetCount, setPacketCount] = useState(initialValues?.packet_count ?? 3)
  const [dnsHost, setDnsHost] = useState(initialValues?.dns_host ?? '')
  const [recordType, setRecordType] = useState(initialValues?.record_type ?? 'A')
  const [dnsServer, setDnsServer] = useState(initialValues?.dns_server ?? '')

  if (!open) return null

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    const base = { name, check_type: checkType, interval, timeout, retries, retry_interval: retryInterval, enabled }
    let payload: CreateMonitorPayload
    if (checkType === 'http') {
      payload = { ...base, url, method, expected_status: expectedStatus, follow_redirects: followRedirects }
    } else if (checkType === 'tcp') {
      payload = { ...base, host, port }
    } else if (checkType === 'ping') {
      payload = { ...base, ping_host: pingHost, packet_count: packetCount }
    } else {
      payload = { ...base, dns_host: dnsHost, record_type: recordType, ...(dnsServer ? { dns_server: dnsServer } : {}) }
    }
    onSubmit(payload)
  }

  const fieldSx = { mb: 2 }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1, fontWeight: 700, fontSize: '1.1rem', fontFamily: '"Bricolage Grotesque", sans-serif' }}>
        {initialValues?.name ? 'Edit Monitor' : 'Add Monitor'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            id="name"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
            placeholder="My Monitor"
            sx={fieldSx}
          />

          <TextField
            id="check_type"
            label="Check Type"
            value={checkType}
            onChange={(e) => setCheckType(e.target.value as CheckType)}
            fullWidth
            size="small"
            select
            slotProps={{ select: { native: true } }}
            sx={fieldSx}
          >
            <option value="http">HTTP</option>
            <option value="tcp">TCP</option>
            <option value="ping">PING</option>
            <option value="dns">DNS</option>
          </TextField>

          {checkType === 'http' && (
            <>
              <TextField id="url" label="URL" type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                fullWidth size="small" placeholder="https://example.com" sx={fieldSx} />
              <TextField id="method" label="Method" value={method} onChange={(e) => setMethod(e.target.value)}
                fullWidth size="small" select slotProps={{ select: { native: true } }} sx={fieldSx}>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="HEAD">HEAD</option>
              </TextField>
              <TextField id="expected_status" label="Expected Status" type="number" value={expectedStatus}
                onChange={(e) => setExpectedStatus(Number(e.target.value))} fullWidth size="small" sx={fieldSx} />
              <FormControlLabel
                control={<Checkbox checked={followRedirects} onChange={(e) => setFollowRedirects(e.target.checked)} size="small" />}
                label="Follow Redirects"
                sx={{ mb: 1, '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
              />
            </>
          )}

          {checkType === 'tcp' && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={8}>
                <TextField id="host" label="Host" value={host} onChange={(e) => setHost(e.target.value)}
                  fullWidth size="small" placeholder="example.com" />
              </Grid>
              <Grid size={4}>
                <TextField id="port" label="Port" type="number" value={port}
                  onChange={(e) => setPort(Number(e.target.value))} fullWidth size="small" />
              </Grid>
            </Grid>
          )}

          {checkType === 'ping' && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={8}>
                <TextField id="ping_host" label="Ping Host" value={pingHost} onChange={(e) => setPingHost(e.target.value)}
                  fullWidth size="small" placeholder="8.8.8.8" />
              </Grid>
              <Grid size={4}>
                <TextField id="packet_count" label="Packets" type="number" value={packetCount}
                  onChange={(e) => setPacketCount(Number(e.target.value))}
                  fullWidth size="small" slotProps={{ htmlInput: { min: 1, max: 20 } }} />
              </Grid>
            </Grid>
          )}

          {checkType === 'dns' && (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={8}>
                  <TextField id="dns_host" label="DNS Host" value={dnsHost} onChange={(e) => setDnsHost(e.target.value)}
                    fullWidth size="small" placeholder="example.com" />
                </Grid>
                <Grid size={4}>
                  <TextField id="record_type" label="Record Type" value={recordType} onChange={(e) => setRecordType(e.target.value)}
                    fullWidth size="small" select slotProps={{ select: { native: true } }}>
                    <option value="A">A</option>
                    <option value="AAAA">AAAA</option>
                    <option value="CNAME">CNAME</option>
                    <option value="MX">MX</option>
                    <option value="TXT">TXT</option>
                  </TextField>
                </Grid>
              </Grid>
              <TextField id="dns_server" label="Custom DNS Server" value={dnsServer} onChange={(e) => setDnsServer(e.target.value)}
                fullWidth size="small" placeholder="8.8.8.8 (leave empty for system default)" sx={fieldSx} />
            </>
          )}

          <Grid container spacing={2}>
            <Grid size={6}>
              <TextField id="interval" label="Interval (s)" type="number" value={interval}
                onChange={(e) => setInterval(Number(e.target.value))} fullWidth size="small" />
            </Grid>
            <Grid size={6}>
              <TextField id="timeout" label="Timeout (s)" type="number" value={timeout}
                onChange={(e) => setTimeout(Number(e.target.value))} fullWidth size="small" />
            </Grid>
            <Grid size={6}>
              <TextField id="retries" label="Retries" type="number" value={retries}
                onChange={(e) => setRetries(Number(e.target.value))} fullWidth size="small" />
            </Grid>
            <Grid size={6}>
              <TextField id="retry_interval" label="Retry Interval (s)" type="number" value={retryInterval}
                onChange={(e) => setRetryInterval(Number(e.target.value))} fullWidth size="small" />
            </Grid>
          </Grid>

          <FormControlLabel
            control={<Checkbox checked={enabled} onChange={(e) => setEnabled(e.target.checked)} size="small" />}
            label="Enabled"
            sx={{ mt: 1, '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" onClick={onClose} sx={{ borderColor: 'divider', color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
