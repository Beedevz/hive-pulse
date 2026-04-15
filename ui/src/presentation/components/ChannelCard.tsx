import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SendIcon from '@mui/icons-material/Send'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { useTestChannel, useChannelLogs } from '../../application/useNotifications'
import type { NotificationChannel, NotificationLog } from '../../domain/notification'

interface Props {
  channel: NotificationChannel
  onEdit: (ch: NotificationChannel) => void
  onDelete: (id: string) => void
}

function timeAgo(iso: string): string {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

function TestIcon({ isPending, result }: Readonly<{ isPending: boolean; result: 'success' | 'error' | null }>) {
  if (isPending) return <CircularProgress size={16} />
  if (result === 'success') return <CheckCircleIcon fontSize="small" />
  if (result === 'error') return <ErrorIcon fontSize="small" />
  return <SendIcon fontSize="small" />
}

function LogRow({ log }: Readonly<{ log: NotificationLog }>) {
  const eventColor = log.event === 'up' ? 'success' : log.event === 'ssl_expiry' ? 'warning' : 'error'
  const eventLabel = log.event === 'ssl_expiry' ? 'SSL' : log.event.toUpperCase()
  const monitorLabel = log.monitor_name || 'Deleted monitor'
  const isDeleted = !log.monitor_name

  return (
    <Box sx={{ py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          label={eventLabel}
          size="small"
          color={eventColor}
          sx={{ fontSize: '0.6875rem', height: 18, fontWeight: 700 }}
        />
        {log.status === 'sent' ? (
          <CheckCircleOutlineIcon sx={{ fontSize: 14, color: 'success.main' }} />
        ) : (
          <ErrorOutlineIcon sx={{ fontSize: 14, color: 'error.main' }} />
        )}
        <Typography
          fontSize="0.8125rem"
          color={isDeleted ? 'text.disabled' : 'text.primary'}
          sx={{ flexGrow: 1 }}
        >
          {monitorLabel}
        </Typography>
        <Typography fontSize="0.75rem" color="text.secondary">
          {timeAgo(log.sent_at)}
        </Typography>
      </Box>
      {log.status === 'failed' && log.error_msg && (
        <Typography fontSize="0.75rem" color="text.secondary" sx={{ mt: 0.25, pl: 0.5 }}>
          {log.error_msg}
        </Typography>
      )}
    </Box>
  )
}

export function ChannelCard({ channel, onEdit, onDelete }: Readonly<Props>) {
  const testMutation = useTestChannel()
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const { data: logs, isFetching } = useChannelLogs(channel.id, isOpen)

  const handleTest = async () => {
    setTestResult(null)
    try {
      await testMutation.mutateAsync(channel.id)
      setTestResult('success')
      setTimeout(() => setTestResult(null), 3000)
    } catch {
      setTestResult('error')
      setTimeout(() => setTestResult(null), 3000)
    }
  }

  let testColor: 'success' | 'error' | 'default' = 'default'
  if (testResult === 'success') testColor = 'success'
  if (testResult === 'error') testColor = 'error'

  const lastLog = logs?.[0]
  const summaryText = isOpen
    ? 'Recent activity'
    : logs === undefined
      ? '— logs'
      : lastLog
        ? `Last ${lastLog.status === 'sent' ? 'sent' : 'failed'} ${timeAgo(lastLog.sent_at)}`
        : 'No notifications sent yet'
  const summaryColor = isOpen || !lastLog ? 'text.disabled' : lastLog.status === 'sent' ? 'success.main' : 'error.main'

  return (
    <Box
      sx={{
        display: 'flex', flexDirection: 'column',
        border: '1px solid', borderColor: 'divider',
        borderRadius: 2, bgcolor: 'background.paper', mb: 1.5,
      }}
    >
      {/* Existing content row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography fontWeight={600} fontSize="0.9375rem">{channel.name}</Typography>
              <Chip label={channel.type} size="small" sx={{ fontSize: '0.6875rem', height: 20 }} />
              {channel.is_global && (
                <Chip label="Global" size="small" color="primary" sx={{ fontSize: '0.6875rem', height: 20 }} />
              )}
            </Box>
            {channel.remind_interval_min > 0 && (
              <Typography fontSize="0.75rem" color="text.secondary">
                Repeat every {channel.remind_interval_min}min
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Send test notification">
            <span>
              <IconButton
                size="small"
                aria-label="test"
                onClick={handleTest}
                disabled={testMutation.isPending}
                color={testColor}
              >
                <TestIcon isPending={testMutation.isPending} result={testResult} />
              </IconButton>
            </span>
          </Tooltip>
          <IconButton size="small" aria-label="edit" onClick={() => onEdit(channel)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label="delete" onClick={() => onDelete(channel.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Log summary row */}
      <Box
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2, py: 0.75, borderTop: '1px solid', borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {lastLog && (
            <Box
              sx={{
                width: 7, height: 7, borderRadius: '50%',
                bgcolor: summaryColor, flexShrink: 0,
              }}
            />
          )}
          <Typography fontSize="0.75rem" color={summaryColor}>
            {summaryText}
          </Typography>
        </Box>
        <Tooltip title={isOpen ? 'Hide logs' : 'Logs'}>
          <IconButton
            size="small"
            aria-label="Logs"
            onClick={() => setIsOpen((v) => !v)}
            sx={{ color: 'text.secondary' }}
          >
            {isOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Inline log list */}
      <Collapse in={isOpen}>
        <Box sx={{ maxHeight: 300, overflowY: 'auto', px: 2, pb: 1 }}>
          {isFetching && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={20} />
            </Box>
          )}
          {!isFetching && (!logs || logs.length === 0) && (
            <Typography fontSize="0.875rem" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No notifications sent yet
            </Typography>
          )}
          {!isFetching && logs && logs.map((log) => (
            <LogRow key={log.id} log={log} />
          ))}
        </Box>
      </Collapse>
    </Box>
  )
}
