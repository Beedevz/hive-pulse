import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import type { StatsBucket } from '../../domain/stats'

interface Props {
  buckets: StatsBucket[]
}

function uptimeColor(bucket: StatsBucket): string {
  if (bucket.total_count === 0) return '#9e9e9e'
  const ratio = bucket.up_count / bucket.total_count
  const r = Math.round(244 + (76 - 244) * ratio)
  const g = Math.round(67 + (175 - 67) * ratio)
  const b = Math.round(54 + (80 - 54) * ratio)
  return `rgb(${r},${g},${b})`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
}

export function UptimeHeatmap({ buckets }: Readonly<Props>) {
  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
        {buckets.map((bucket, i) => {
          const color = uptimeColor(bucket)
          const pct =
            bucket.total_count === 0
              ? 'No data'
              : `${Math.round((bucket.up_count / bucket.total_count) * 100)}% uptime`
          const label = `${formatDate(bucket.time)} — ${pct}`
          return (
            <Tooltip key={i} title={label} arrow>
              <Box
                data-testid="heatmap-cell"
                sx={{
                  width: 10,
                  height: 10,
                  backgroundColor: color,
                  borderRadius: '1px',
                  cursor: 'default',
                }}
              />
            </Tooltip>
          )
        })}
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mt: 1, alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, backgroundColor: '#f44336', borderRadius: '1px' }} />
          <Typography variant="caption">Down</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, backgroundColor: '#4caf50', borderRadius: '1px' }} />
          <Typography variant="caption">Up</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, backgroundColor: '#9e9e9e', borderRadius: '1px' }} />
          <Typography variant="caption">No data</Typography>
        </Box>
      </Box>
    </Box>
  )
}
