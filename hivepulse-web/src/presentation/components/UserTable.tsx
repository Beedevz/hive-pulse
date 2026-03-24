import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import type { User } from '../../domain/user'

interface UserTableProps {
  users: User[]
  currentUserId: string
  onRoleChange: (id: string, role: string) => void
  onDelete: (id: string) => void
}

export function UserTable({ users, currentUserId, onRoleChange, onDelete }: Readonly<UserTableProps>) {
  return (
    <Table size="small" sx={{ '& td, & th': { py: 1.5 } }}>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Email</TableCell>
          <TableCell>Role</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {users.map((u) => (
          <TableRow key={u.id} sx={{ '&:last-child td': { border: 0 } }}>
            <TableCell sx={{ color: 'text.primary' }}>{u.name}</TableCell>
            <TableCell sx={{ color: 'text.secondary' }}>{u.email}</TableCell>
            <TableCell>
              <Select
                size="small"
                value={u.role}
                onChange={(e) => onRoleChange(u.id, e.target.value)}
                disabled={u.id === currentUserId}
                sx={{ fontSize: '0.8125rem', minWidth: 100 }}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="editor">Editor</MenuItem>
                <MenuItem value="viewer">Viewer</MenuItem>
              </Select>
            </TableCell>
            <TableCell align="right">
              <Button
                size="small"
                color="error"
                variant="outlined"
                onClick={() => onDelete(u.id)}
                disabled={u.id === currentUserId}
                sx={{ fontSize: '0.75rem' }}
              >
                Remove
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
