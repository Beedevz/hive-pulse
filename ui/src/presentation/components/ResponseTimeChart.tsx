import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceArea,
} from 'recharts'
import type { StatsBucket, DownPeriod, StatsRange } from '../../domain/stats'

interface Props {
  buckets: StatsBucket[]
  downPeriods: DownPeriod[]
  range: StatsRange
  onRangeChange: (r: StatsRange) => void
}

const RANGES: StatsRange[] = ['1h', '3h', '6h', '24h', '48h', '7d', '15d', '30d', '90d']

function formatTick(ts: number, range: StatsRange): string {
  const d = new Date(ts)
  if (['1h', '3h', '6h', '24h', '48h'].includes(range)) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function ResponseTimeChart({ buckets, downPeriods, range, onRangeChange }: Readonly<Props>) {
  const theme = useTheme()

  const data = buckets.map((b) => ({
    ts: new Date(b.time).getTime(),
    avg_ping_ms: b.avg_ping_ms,
  }))

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Typography fontSize="0.875rem" fontWeight={600} color="text.secondary">
          Response Time
        </Typography>
        <Select
          value={range}
          onChange={(e) => onRangeChange(e.target.value as StatsRange)}
          size="small"
          variant="standard"
          disableUnderline
          sx={{ fontSize: '0.75rem', color: 'text.secondary', minWidth: 48, fontFamily: 'monospace' }}
        >
          {RANGES.map((r) => (
            <MenuItem key={r} value={r} sx={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
              {r}
            </MenuItem>
          ))}
        </Select>
      </div>
      {(!buckets || buckets.length === 0) ? (
        <Typography fontSize="0.8125rem" color="text.secondary">No data</Typography>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis
              dataKey="ts"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(ts) => formatTick(ts, range)}
              tick={{ fontSize: 11 }}
            />
            <YAxis unit=" ms" tick={{ fontSize: 11 }} width={52} />
            <Tooltip
              labelFormatter={(ts) => new Date(ts as number).toLocaleString()}
              contentStyle={{
                background: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 6,
                fontSize: 12,
              }}
              labelStyle={{ color: theme.palette.text.secondary }}
              itemStyle={{ color: theme.palette.text.primary }}
            />
            {downPeriods.map((dp) => (
              <ReferenceArea
                key={dp.started_at}
                x1={new Date(dp.started_at).getTime()}
                x2={dp.resolved_at ? new Date(dp.resolved_at).getTime() : undefined}
                fill="rgba(248,113,113,0.35)"
                strokeOpacity={0}
              />
            ))}
            <Line
              type="monotone"
              dataKey="avg_ping_ms"
              stroke="#F5A623"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </>
  )
}
