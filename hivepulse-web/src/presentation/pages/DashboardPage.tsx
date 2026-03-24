import { useState } from 'react'
import { Plus } from 'lucide-react'
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
  const unknownCount = allMonitors.filter(m => m.last_status === 'unknown').length
  const filtered = allMonitors.filter(m => matchesSearch(m, searchTerm))

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
    <div className="flex min-h-screen" style={{ background: '#0d0f14' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Page header */}
        <div
          className="flex items-center justify-between px-8 py-5"
          style={{ borderBottom: '1px solid #1f2937' }}
        >
          <div>
            <h1 className="text-lg font-semibold text-white">Monitors</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {allMonitors.length} total
              {downCount > 0 && <span className="text-red-400 ml-2">· {downCount} down</span>}
            </p>
          </div>
          {me?.role !== 'viewer' && (
            <button
              onClick={() => { setEditTarget(null); setModalOpen(true) }}
              className="flex items-center gap-2 text-sm font-medium text-white px-4 py-2 rounded-lg transition-colors"
              style={{ background: '#6366f1' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#4f46e5')}
              onMouseLeave={e => (e.currentTarget.style.background = '#6366f1')}
            >
              <Plus size={15} />
              Add Monitor
            </button>
          )}
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-6 px-8 py-3" style={{ borderBottom: '1px solid #1f2937' }}>
          <StatChip color="#4ade80" label="Up" value={upCount} />
          <StatChip color="#f87171" label="Down" value={downCount} />
          <StatChip color="#6b7280" label="Unknown" value={unknownCount} />
        </div>

        {/* Content */}
        <main className="flex-1 px-8 py-6">
          <div className="mb-5" style={{ maxWidth: 680 }}>
            <MonitorSearch onSearch={setSearchTerm} />
          </div>

          {isLoading && <div className="text-gray-500 text-sm">Loading monitors…</div>}

          {!isLoading && filtered.length === 0 && (
            <EmptyState hasSearch={!!searchTerm} canAdd={me?.role !== 'viewer'} onAdd={() => { setEditTarget(null); setModalOpen(true) }} />
          )}

          {!isLoading && filtered.length > 0 && (
            <div style={{ maxWidth: 680 }}>
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
            <div className="flex items-center gap-3 mt-6 text-sm text-gray-500" style={{ maxWidth: 680 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-md border border-gray-700 hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed text-gray-400"
              >
                ← Prev
              </button>
              <span className="text-gray-500">Page {page} of {Math.ceil((data?.total ?? 0) / 20)}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 20 >= (data?.total ?? 0)}
                className="px-3 py-1.5 rounded-md border border-gray-700 hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed text-gray-400"
              >
                Next →
              </button>
            </div>
          )}
        </main>
      </div>

      <MonitorModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null) }}
        onSubmit={handleSubmit}
        initialValues={editTarget ?? undefined}
      />
    </div>
  )
}

function StatChip({ color, label, value }: Readonly<{ color: string; label: string; value: number }>) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  )
}

function EmptyState({ hasSearch, canAdd, onAdd }: Readonly<{ hasSearch: boolean; canAdd: boolean; onAdd: () => void }>) {
  if (hasSearch) {
    return <p className="text-gray-500 text-sm">No monitors match your search.</p>
  }
  return (
    <div className="text-center py-16">
      <p className="text-gray-400 mb-4">No monitors yet.</p>
      {canAdd && (
        <button
          onClick={onAdd}
          className="text-sm text-indigo-400 hover:text-indigo-300 underline"
        >
          Add your first monitor
        </button>
      )}
    </div>
  )
}
