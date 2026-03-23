import { useState } from 'react'
import { useMonitors, useCreateMonitor, useUpdateMonitor, useDeleteMonitor } from '../../application/useMonitors'
import { useMe } from '../../application/useAuth'
import { useWebSocket } from '../../application/useWebSocket'
import { MonitorTable } from '../components/MonitorTable'
import { MonitorModal } from '../components/MonitorModal'
import { Sidebar } from '../components/Sidebar'
import type { Monitor, CreateMonitorPayload } from '../../domain/monitor'

export function DashboardPage() {
  useWebSocket()

  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Monitor | null>(null)

  const { data, isLoading } = useMonitors(page, 20)
  const { data: me } = useMe()
  const createMutation = useCreateMonitor()
  const updateMutation = useUpdateMonitor()
  const deleteMutation = useDeleteMonitor()

  const upCount = data?.data.filter(m => m.last_status === 'up').length ?? 0
  const downCount = data?.data.filter(m => m.last_status === 'down').length ?? 0

  function handleSubmit(payload: CreateMonitorPayload) {
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, payload }, { onSuccess: () => { setModalOpen(false); setEditTarget(null) } })
    } else {
      createMutation.mutate(payload, { onSuccess: () => setModalOpen(false) })
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Monitors</h1>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{upCount} up</span>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{downCount} down</span>
          </div>
          {me?.role !== 'viewer' && (
            <button
              onClick={() => { setEditTarget(null); setModalOpen(true) }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
            >
              + Monitor Ekle
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <MonitorTable
            monitors={data?.data ?? []}
            currentUserRole={me?.role ?? 'viewer'}
            onEdit={m => { setEditTarget(m); setModalOpen(true) }}
            onDelete={id => deleteMutation.mutate(id)}
          />
        )}

        {(data?.total ?? 0) > 20 && (
          <div className="flex gap-2 mt-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
            <span>Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= (data?.total ?? 0)}>Next</button>
          </div>
        )}

        <MonitorModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setEditTarget(null) }}
          onSubmit={handleSubmit}
          initialValues={editTarget ?? undefined}
        />
      </main>
    </div>
  )
}
