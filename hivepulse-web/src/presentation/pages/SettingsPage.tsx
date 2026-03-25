import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import { useUsers, useUpdateUserRole, useDeleteUser } from '../../application/useUsers'
import { useMe } from '../../application/useAuth'
import {
  useChannels, useCreateChannel, useUpdateChannel, useDeleteChannel,
  useSMTPSettings, useUpdateSMTPSettings,
} from '../../application/useNotifications'
import type { SMTPSettings } from '../../application/useNotifications'
import { UserTable } from '../components/UserTable'
import { ChannelCard } from '../components/ChannelCard'
import { ChannelModal } from '../components/ChannelModal'
import { Sidebar } from '../components/Sidebar'
import type { NotificationChannel, CreateChannelInput } from '../../domain/notification'

function SMTPForm() {
  const { data: smtp } = useSMTPSettings()
  const updateSMTP = useUpdateSMTPSettings()
  const [form, setForm] = useState<SMTPSettings>({ host: '', port: 587, user: '', password: '', from: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (smtp) setForm(smtp)
  }, [smtp])

  const handleSave = () => {
    updateSMTP.mutate(form, {
      onSuccess: () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      },
    })
  }

  const set = (field: keyof SMTPSettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: field === 'port' ? Number(e.target.value) : e.target.value }))

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Typography variant="subtitle1" fontWeight={600} mb={2}>SMTP Configuration</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Used to send email notifications. Leave empty to disable email alerts.
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Host"
            value={form.host}
            onChange={set('host')}
            placeholder="smtp.example.com"
            fullWidth
          />
          <TextField
            label="Port"
            type="number"
            value={form.port}
            onChange={set('port')}
            sx={{ width: 100 }}
            inputProps={{ min: 1, max: 65535 }}
          />
        </Box>
        <TextField
          label="Username"
          value={form.user}
          onChange={set('user')}
          fullWidth
          autoComplete="off"
        />
        <TextField
          label="Password"
          type="password"
          value={form.password}
          onChange={set('password')}
          fullWidth
          placeholder={smtp?.password === '***' ? '••••••••' : ''}
          autoComplete="new-password"
        />
        <TextField
          label="From address"
          value={form.from}
          onChange={set('from')}
          placeholder="noreply@example.com"
          fullWidth
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={updateSMTP.isPending}
          >
            {updateSMTP.isPending ? 'Saving…' : 'Save SMTP Settings'}
          </Button>
          {saved && <Alert severity="success" sx={{ py: 0 }}>Saved!</Alert>}
          {updateSMTP.isError && <Alert severity="error" sx={{ py: 0 }}>Failed to save</Alert>}
        </Box>
      </Box>
    </Box>
  )
}

function NotificationsTab() {
  const { data: channels = [] } = useChannels()
  const createChannel = useCreateChannel()
  const updateChannel = useUpdateChannel()
  const deleteChannel = useDeleteChannel()
  const [modalOpen, setModalOpen] = useState(false)
  const [editChannel, setEditChannel] = useState<NotificationChannel | null>(null)

  const handleEdit = (ch: NotificationChannel) => {
    setEditChannel(ch)
    setModalOpen(true)
  }

  const handleDelete = (id: string) => {
    deleteChannel.mutate(id)
  }

  const handleSubmit = (input: CreateChannelInput) => {
    if (editChannel) {
      updateChannel.mutate({ id: editChannel.id, ...input })
    } else {
      createChannel.mutate(input)
    }
    setModalOpen(false)
    setEditChannel(null)
  }

  return (
    <Box>
      <SMTPForm />

      <Divider sx={{ my: 4 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Notification Channels</Typography>
        <Button variant="contained" onClick={() => { setEditChannel(null); setModalOpen(true) }}>
          Add Channel
        </Button>
      </Box>
      {channels.map((ch) => (
        <ChannelCard key={ch.id} channel={ch} onEdit={handleEdit} onDelete={handleDelete} />
      ))}
      {channels.length === 0 && (
        <Typography color="text.secondary" fontSize="0.875rem">
          No channels yet. Add one to start receiving notifications.
        </Typography>
      )}
      <ChannelModal
        key={editChannel?.id ?? 'new'}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditChannel(null) }}
        onSubmit={handleSubmit}
        channel={editChannel ?? undefined}
      />
    </Box>
  )
}

export function SettingsPage() {
  const [tab, setTab] = useState(0)
  const { data: me } = useMe()
  const { data: usersData } = useUsers(1, 50)
  const updateRoleMutation = useUpdateUserRole()
  const deleteUserMutation = useDeleteUser()

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Box sx={{ px: 4, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={600} color="text.primary" fontSize="1.0625rem">
            Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" fontSize="0.8125rem">
            Manage users and workspace settings
          </Typography>
        </Box>

        <Box sx={{ flex: 1, px: 4, py: 3 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              mb: 3,
              borderBottom: '1px solid',
              borderColor: 'divider',
              '& .MuiTab-root': { textTransform: 'none', fontSize: '0.875rem', minHeight: 40, py: 1 },
            }}
          >
            <Tab label="General" />
            {me?.role === 'admin' && <Tab label="Users" />}
            {me?.role === 'admin' && <Tab label="Notifications" />}
          </Tabs>

          {tab === 0 && (
            <Typography color="text.secondary" fontSize="0.875rem">
              General settings — coming in a future slice.
            </Typography>
          )}

          {tab === 1 && me?.role === 'admin' && (
            <UserTable
              users={usersData?.data ?? []}
              currentUserId={me.id}
              onRoleChange={(id, role) => updateRoleMutation.mutate({ id, role })}
              onDelete={(id) => deleteUserMutation.mutate(id)}
            />
          )}

          {tab === 2 && me?.role === 'admin' && (
            <NotificationsTab />
          )}
        </Box>
      </Box>
    </Box>
  )
}
