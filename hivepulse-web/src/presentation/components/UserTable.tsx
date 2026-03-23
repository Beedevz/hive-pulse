import React from 'react'
import { User } from '../../domain/user'

interface UserTableProps {
  users: User[]
  currentUserId: string
  onRoleChange: (id: string, role: string) => void
  onDelete: (id: string) => void
}

export default function UserTable({ users, currentUserId, onRoleChange, onDelete }: UserTableProps) {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map(u => (
          <tr key={u.id}>
            <td>{u.name}</td>
            <td>{u.email}</td>
            <td>
              <select
                value={u.role}
                onChange={e => onRoleChange(u.id, e.target.value)}
                disabled={u.id === currentUserId}
              >
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </td>
            <td>
              <button onClick={() => onDelete(u.id)} disabled={u.id === currentUserId}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
