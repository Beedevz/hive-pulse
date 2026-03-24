// hivepulse-web/src/presentation/components/MonitorCard.tsx
import { useEffect, useRef, useState } from 'react'
import type { Monitor } from '../../domain/monitor'
import { useHeartbeats } from '../../application/useMonitors'
import { UptimeBar } from './UptimeBar'

interface MonitorCardProps {
  monitor: Monitor
  currentUserRole: string
  onEdit: (m: Monitor) => void
  onDelete: (id: string) => void
}

const statusColors = {
  up:      { border: '#4ade80', dot: '#4ade80', glow: 'rgba(74,222,128,0.8)' },
  down:    { border: '#f87171', dot: '#f87171', glow: 'rgba(248,113,113,0.8)' },
  unknown: { border: '#6b7280', dot: '#6b7280', glow: 'none' },
} as const

function getColors(status: string) {
  return statusColors[status as keyof typeof statusColors] ?? statusColors.unknown
}

function Sparkline({ pings }: { pings: number[] }) {
  if (pings.length === 0) {
    return <svg width="100%" height="24" />
  }
  const max = Math.max(...pings, 1)
  const w = 300
  const h = 24
  const pts = pings
    .map((p, i) => {
      const x = (i / (pings.length - 1 || 1)) * w
      const y = h - (p / max) * (h - 2) - 1
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

export function MonitorCard({ monitor, currentUserRole, onEdit, onDelete }: MonitorCardProps) {
  const colors = getColors(monitor.last_status)
  const prevStatusRef = useRef(monitor.last_status)
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    if (prevStatusRef.current !== 'down' && monitor.last_status === 'down') {
      setShaking(true)
      const t = setTimeout(() => setShaking(false), 400)
      return () => clearTimeout(t)
    }
    prevStatusRef.current = monitor.last_status
  }, [monitor.last_status])

  const { data: hbData } = useHeartbeats(monitor.id)
  const heartbeats = hbData?.data ?? []

  const blocks = heartbeats.length > 0
    ? heartbeats.map(h => h.status as 'up' | 'down' | 'slow' | 'unknown')
    : Array(48).fill('unknown' as const)

  const sparklinePings = heartbeats.slice(-24).map(h => h.ping_ms)

  const avgPing = heartbeats.length > 0
    ? Math.round(heartbeats.reduce((s, h) => s + h.ping_ms, 0) / heartbeats.length)
    : null

  const subLabel = monitor.url ?? monitor.host ?? monitor.ping_host ?? monitor.dns_host ?? ''

  return (
    <div
      style={{
        borderLeft: `3px solid ${colors.border}`,
        borderRadius: '8px',
        background: 'var(--color-surface, #1a1c2e)',
        padding: '12px 14px',
        marginBottom: '8px',
        animation: shaking ? 'shake 0.4s ease-in-out' : undefined,
      }}
    >
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-4px)}
          40%{transform:translateX(4px)}
          60%{transform:translateX(-3px)}
          80%{transform:translateX(3px)}
        }
        @keyframes pulse-glow {
          0%,100%{box-shadow:0 0 4px ${colors.glow}}
          50%{box-shadow:0 0 10px ${colors.glow}}
        }
      `}</style>

      {/* Top row */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            style={{
              width: 10, height: 10, borderRadius: '50%',
              background: colors.dot,
              boxShadow: `0 0 6px ${colors.glow}`,
              animation: 'pulse-glow 2s ease-in-out infinite',
              flexShrink: 0,
            }}
          />
          <div>
            <div className="font-semibold text-sm text-gray-100">{monitor.name}</div>
            {subLabel && <div className="text-xs text-gray-400">{subLabel}</div>}
          </div>
        </div>
        <div className="flex items-center gap-3 text-right">
          <div className="text-xs text-gray-400">
            {monitor.check_type.toUpperCase()} · {monitor.interval}s
            {avgPing !== null && <> · avg {avgPing}ms</>}
          </div>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{
              background: `${colors.border}22`,
              color: colors.border,
            }}
          >
            {monitor.last_status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* UptimeBar */}
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-1">
          <UptimeBar blocks={blocks} />
        </div>
        <span className="text-xs font-semibold" style={{ color: colors.border }}>
          {(monitor.uptime_24h * 100).toFixed(1)}%
        </span>
      </div>

      {/* Sparkline */}
      <div style={{ color: colors.border, marginBottom: '6px' }}>
        <Sparkline pings={sparklinePings} />
      </div>

      {/* Actions */}
      {currentUserRole !== 'viewer' && (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => onEdit(monitor)}
            className="text-xs bg-gray-700 text-gray-300 px-3 py-1 rounded hover:bg-gray-600"
          >
            Edit
          </button>
          <button
            onClick={() => { if (window.confirm('Delete monitor?')) onDelete(monitor.id) }}
            className="text-xs bg-red-900/40 text-red-400 px-3 py-1 rounded hover:bg-red-900/70"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
