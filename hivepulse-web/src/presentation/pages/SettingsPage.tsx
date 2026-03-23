import { useState } from 'react'
import { useUsers, useUpdateUserRole, useDeleteUser } from '../../application/useUsers'
import { useMe } from '../../application/useAuth'
import { UserTable } from '../components/UserTable'
import { Sidebar } from '../components/Sidebar'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'users'>('general')
  const { data: me } = useMe()
  const { data: usersData } = useUsers(1, 50)
  const updateRoleMutation = useUpdateUserRole()
  const deleteUserMutation = useDeleteUser()

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-2 text-sm font-medium ${activeTab === 'general' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            General
          </button>
          {me?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-2 text-sm font-medium ${activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            >
              Users
            </button>
          )}
        </div>

        {activeTab === 'general' && (
          <p className="text-gray-500 text-sm">General settings — coming in a future slice.</p>
        )}

        {activeTab === 'users' && me?.role === 'admin' && (
          <UserTable
            users={usersData?.data ?? []}
            currentUserId={me.id}
            onRoleChange={(id, role) => updateRoleMutation.mutate({ id, role })}
            onDelete={id => deleteUserMutation.mutate(id)}
          />
        )}
      </main>
    </div>
  )
}
