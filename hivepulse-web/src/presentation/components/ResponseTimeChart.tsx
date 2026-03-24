import Typography from '@mui/material/Typography'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { StatsBucket, StatsRange } from '../../domain/stats'

interface Props {
  buckets: StatsBucket[]
  range: '24h' | '7d'
}

function formatTime(iso: string, range: StatsRange): string {
  const d = new Date(iso)
  if (range === '24h') {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
}

export function ResponseTimeChart({ buckets, range }: Readonly<Props>) {
  if (!buckets || buckets.length === 0) {
    return <Typography>No data</Typography>
  }

  const data = buckets.map((b) => ({
    time: formatTime(b.time, range),
    avg_ping_ms: b.avg_ping_ms,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis dataKey="time" />
        <YAxis unit=" ms" />
        <Tooltip />
        <Line type="monotone" dataKey="avg_ping_ms" stroke="#1976d2" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
