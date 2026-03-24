import { useState } from 'react'
import { useMonitors, useCreateMonitor, useUpdateMonitor, useDeleteMonitor } from '../../application/useMonitors'
import { useMe } from '../../application/useAuth'
import { useWebSocket } from '../../application/useWebSocket'
import { MonitorCard } from '../components/MonitorCard'
import { MonitorSearch } from '../components/MonitorSearch'
import { MonitorModal } from '../components/MonitorModal'
import { Sidebar } from '../components/Sidebar'
import type { Monitor, CreateMonitorPayload } from '../../domain/monitor'

function matchesSearch(m: Monitor, term: string): boolean {
  if (!term) return true
  const t = term.toLowerCase()
  return (
    m.name.toLowerCase().includes(t) ||
    (m.url ?? '').toLowerCase().includes(t) ||
    (m.host ?? '').toLowerCase().includes(t) ||
    (m.ping_host ?? '').toLowerCase().includes(t) ||
    (m.dns_host ?? '').toLowerCase().includes(t)
  )
}

export function DashboardPage() {
  useWebSocket()

  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Monitor | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading } = useMonitors(page, 20)
  const { data: me } = useMe()
  const createMutation = useCreateMonitor()
  const updateMutation = useUpdateMonitor()
  const deleteMutation = useDeleteMonitor()

  const allMonitors = data?.data ?? []
  const upCount = allMonitors.filter(m => m.last_status === 'up').length
  const downCount = allMonitors.filter(m => m.last_status === 'down').length
  const filtered = allMonitors.filter(m => matchesSearch(m, searchTerm))
  const emptyMessage = searchTerm ? 'No monitors match your search.' : 'No monitors yet.'

  function handleSubmit(payload: CreateMonitorPayload) {
    if (editTarget) {
      updateMutation.mutate(
        { id: editTarget.id, payload },
        { onSuccess: () => { setModalOpen(false); setEditTarget(null) } }
      )
    } else {
      createMutation.mutate(payload, { onSuccess: () => setModalOpen(false) })
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">Monitors</h1>
            <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded-full">{upCount} up</span>
            <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full">{downCount} down</span>
          </div>
          {me?.role !== 'viewer' && (
            <button
              onClick={() => { setEditTarget(null); setModalOpen(true) }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
            >
              + Add Monitor
            </button>
          )}
        </div>

        <div className="mb-4 max-w-3xl">
          <MonitorSearch onSearch={setSearchTerm} />
        </div>

        {isLoading ? (
          <div className="text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-500 text-sm">{emptyMessage}</div>
        ) : (
          <div className="max-w-3xl">
            {filtered.map(m => (
              <MonitorCard
                key={m.id}
                monitor={m}
                currentUserRole={me?.role ?? 'viewer'}
                onEdit={mon => { setEditTarget(mon); setModalOpen(true) }}
                onDelete={id => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        )}

        {(data?.total ?? 0) > 20 && (
          <div className="flex gap-2 mt-4 text-sm text-gray-400">
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
