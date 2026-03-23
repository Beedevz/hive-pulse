import type { Monitor } from '../../domain/monitor'
import { UptimeBar } from './UptimeBar'

interface MonitorTableProps {
  monitors: Monitor[]
  onEdit: (m: Monitor) => void
  onDelete: (id: string) => void
  currentUserRole: string
}

export function MonitorTable({ monitors, onEdit, onDelete, currentUserRole }: MonitorTableProps) {
  return (
    <table>
      <thead>
        <tr>
          <th>Status</th>
          <th>Name</th>
          <th>Uptime (24h)</th>
          <th>Uptime %</th>
          <th>Created At</th>
          {currentUserRole !== 'viewer' && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {monitors.map(m => (
          <tr key={m.id}>
            <td>
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor:
                    m.last_status === 'up'
                      ? 'green'
                      : m.last_status === 'down'
                      ? 'red'
                      : 'gray',
                }}
              />
            </td>
            <td>
              <strong>{m.name}</strong>
              <br />
              <small>{m.url ?? m.host ?? m.ping_host ?? m.dns_host ?? ''}</small>
            </td>
            <td>
              <UptimeBar blocks={Array(48).fill(m.last_status === 'up' ? 'up' : 'unknown')} />
            </td>
            <td>{(m.uptime_24h * 100).toFixed(1)}%</td>
            <td>{m.created_at}</td>
            {currentUserRole !== 'viewer' && (
              <td>
                <button onClick={() => onEdit(m)}>Edit</button>
                <button
                  onClick={() => {
                    if (window.confirm('Delete monitor?')) onDelete(m.id)
                  }}
                >
                  Delete
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
