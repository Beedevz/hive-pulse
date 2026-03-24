import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { useUsers, useUpdateUserRole, useDeleteUser } from '../../application/useUsers'
import { useMe } from '../../application/useAuth'
import { UserTable } from '../components/UserTable'
import { Sidebar } from '../components/Sidebar'

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
        </Box>
      </Box>
    </Box>
  )
}
