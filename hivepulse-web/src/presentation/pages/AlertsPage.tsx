import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useIncidents } from '../../application/useIncidents'
import type { IncidentFilter } from '../../application/useIncidents'
import type { Incident } from '../../domain/incident'
import { Sidebar } from '../components/Sidebar'

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function LiveDuration({ startedAt }: Readonly<{ startedAt: string }>) {
  const [secs, setSecs] = useState(
    Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
  )
  useEffect(() => {
    const t = setInterval(() => {
      setSecs(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
    }, 1000)
    return () => clearInterval(t)
  }, [startedAt])
  return (
    <span className="font-mono font-bold text-red-400 text-sm tabular-nums">
      {formatDuration(secs)}
    </span>
  )
}

function ActiveIncidentCard({ inc }: Readonly<{ inc: Incident }>) {
  return (
    <div
      className="rounded-xl mb-3"
      style={{
        background: 'rgba(239,68,68,0.06)',
        border: '1px solid rgba(239,68,68,0.25)',
        borderLeft: '3px solid #f87171',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: '#f87171', boxShadow: '0 0 8px rgba(248,113,113,0.8)' }}
          />
          <span className="font-semibold text-white">{inc.monitor_name}</span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}
          >
            DOWN
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <Clock size={12} />
          <span>Ongoing:</span>
          <LiveDuration startedAt={inc.started_at} />
        </div>
      </div>

      {/* Error reason — the most important info */}
      {inc.error_msg && (
        <div className="flex items-start gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(239,68,68,0.1)' }}>
          <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-red-300 font-medium">{inc.error_msg}</span>
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center gap-6 px-4 py-2.5 text-xs text-gray-500">
        <span>Started: <span className="text-gray-400">{new Date(inc.started_at).toLocaleString()}</span></span>
      </div>
    </div>
  )
}

function ResolvedIncidentCard({ inc }: Readonly<{ inc: Incident }>) {
  return (
    <div
      className="rounded-xl mb-3"
      style={{
        background: 'rgba(17,24,39,0.6)',
        border: '1px solid #1f2937',
        borderLeft: '3px solid #4ade80',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
          <span className="font-medium text-gray-300">{inc.monitor_name}</span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}
          >
            RESOLVED
          </span>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold text-green-400">
            Downtime: {formatDuration(inc.duration_s)}
          </div>
          <div className="text-xs text-gray-600 mt-0.5">
            {new Date(inc.started_at).toLocaleTimeString()} → {inc.resolved_at ? new Date(inc.resolved_at).toLocaleTimeString() : ''}
          </div>
        </div>
      </div>

      {inc.error_msg && (
        <div className="flex items-center gap-2 px-4 pb-2.5 text-xs text-gray-500">
          <AlertCircle size={12} className="flex-shrink-0" />
          <span>{inc.error_msg}</span>
        </div>
      )}
    </div>
  )
}

export function AlertsPage() {
  const [filter, setFilter] = useState<IncidentFilter>('all')
  const { data: activeData, isLoading: loadingActive } = useIncidents('active')
  const { data: resolvedData, isLoading: loadingResolved } = useIncidents('resolved')

  const activeIncidents = activeData?.data ?? []
  const resolvedIncidents = resolvedData?.data ?? []

  const showActive = filter === 'all' || filter === 'active'
  const showResolved = filter === 'all' || filter === 'resolved'

  const filters: { f: IncidentFilter; label: string }[] = [
    { f: 'all', label: 'All' },
    { f: 'active', label: 'Active' },
    { f: 'resolved', label: 'Resolved' },
  ]

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
            <h1 className="text-lg font-semibold text-white">Alerts</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {activeIncidents.length > 0
                ? <span className="text-red-400">{activeIncidents.length} active incident{activeIncidents.length > 1 ? 's' : ''}</span>
                : 'No active incidents'}
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: '#1a1d27' }}>
            {filters.map(({ f, label }) => (
              <button
                key={f}
                aria-label={label}
                onClick={() => setFilter(f)}
                className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                style={
                  filter === f
                    ? { background: '#374151', color: '#f9fafb' }
                    : { color: '#6b7280' }
                }
              >
                {label}
                {f === 'active' && activeIncidents.length > 0 && (
                  <span
                    className="ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(248,113,113,0.2)', color: '#f87171' }}
                  >
                    {activeIncidents.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 px-8 py-6" style={{ maxWidth: 800 }}>
          {showActive && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={14} className="text-red-400" />
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  Active Incidents
                </span>
                <span className="text-xs text-gray-600">({activeIncidents.length})</span>
              </div>

              {loadingActive && <p className="text-gray-500 text-sm">Loading…</p>}

              {!loadingActive && activeIncidents.length === 0 && (
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-500"
                  style={{ background: '#111827', border: '1px solid #1f2937' }}
                >
                  <CheckCircle size={14} className="text-green-500" />
                  All monitors are up — no active incidents.
                </div>
              )}

              {!loadingActive && activeIncidents.map(inc => (
                <ActiveIncidentCard key={inc.id} inc={inc} />
              ))}
            </section>
          )}

          {showResolved && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={14} className="text-green-400" />
                <span className="text-xs font-bold text-green-400 uppercase tracking-wider">
                  Resolved
                </span>
                <span className="text-xs text-gray-600">({resolvedIncidents.length})</span>
              </div>

              {loadingResolved && <p className="text-gray-500 text-sm">Loading…</p>}

              {!loadingResolved && resolvedIncidents.length === 0 && (
                <p className="text-gray-500 text-sm">No resolved incidents.</p>
              )}

              {!loadingResolved && resolvedIncidents.map(inc => (
                <ResolvedIncidentCard key={inc.id} inc={inc} />
              ))}
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
