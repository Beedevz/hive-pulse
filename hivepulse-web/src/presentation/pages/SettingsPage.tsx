import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
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
import { TagManager } from '../components/TagManager'
import { GeneralSettingsSection } from '../components/GeneralSettingsSection'
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
            slotProps={{ htmlInput: { min: 1, max: 65535 } }}
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

function NotificationsSection() {
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

type SectionKey = 'general' | 'users' | 'notifications' | 'tags'

export function SettingsPage() {
  const [section, setSection] = useState<SectionKey>('general')
  const { data: me } = useMe()
  const { data: usersData } = useUsers(1, 50)
  const updateRoleMutation = useUpdateUserRole()
  const deleteUserMutation = useDeleteUser()

  const navItems: { key: SectionKey; label: string }[] = [
    { key: 'general', label: 'General' },
    ...(me?.role === 'admin' ? [
      { key: 'users' as SectionKey, label: 'Users' },
      { key: 'notifications' as SectionKey, label: 'Notifications' },
      { key: 'tags' as SectionKey, label: 'Tags' },
    ] : []),
  ]

  const currentLabel = navItems.find((i) => i.key === section)?.label ?? ''

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <Box sx={{ px: 4, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={600} color="text.primary" fontSize="1.0625rem">
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" fontSize="0.8125rem">
          Manage users and workspace settings
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Left sidebar */}
        <Box sx={{ width: 220, flexShrink: 0, borderRight: '1px solid', borderColor: 'divider', pt: 1 }}>
          <Box component="nav">
            {navItems.map((item) => (
              <Box
                key={item.key}
                onClick={() => setSection(item.key)}
                sx={{
                  px: 2.5, py: 1.25,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: section === item.key ? 600 : 400,
                  color: section === item.key ? 'primary.main' : 'text.primary',
                  bgcolor: section === item.key ? 'action.selected' : 'transparent',
                  borderLeft: section === item.key ? '3px solid' : '3px solid transparent',
                  borderColor: section === item.key ? 'primary.main' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                  transition: 'all 0.15s',
                }}
              >
                {item.label}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Right content */}
        <Box sx={{ flex: 1, p: 4, maxWidth: 680 }}>
          <Typography variant="h6" fontWeight={700}  mb={3}>
            {currentLabel}
          </Typography>

          {section === 'general' && (
            <GeneralSettingsSection />
          )}

          {section === 'users' && me?.role === 'admin' && (
            <UserTable
              users={usersData?.data ?? []}
              currentUserId={me.id}
              onRoleChange={(id, role) => updateRoleMutation.mutate({ id, role })}
              onDelete={(id) => deleteUserMutation.mutate(id)}
            />
          )}

          {section === 'notifications' && me?.role === 'admin' && (
            <NotificationsSection />
          )}

          {section === 'tags' && me?.role === 'admin' && (
            <TagManager />
          )}
        </Box>
      </Box>
    </Box>
  )
}
