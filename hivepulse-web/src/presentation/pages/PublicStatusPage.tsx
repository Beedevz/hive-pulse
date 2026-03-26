import { useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import { usePublicStatusPage } from '../../application/useStatusPages'
import { UptimeBar } from '../components/UptimeBar'
import { HoneycombBg } from '../components/HoneycombBg'
import type { PublicMonitorRow, PublicIncident, DailyBucket } from '../../domain/statusPage'
import type { BlockStatus } from '../components/UptimeBar'

function bucketToBlock(b: DailyBucket): BlockStatus {
  if (b.uptime_pct >= 0.99) return 'up'
  if (b.uptime_pct === 0) return 'down'
  return 'unknown'
}

function toBlocks(buckets: DailyBucket[]): BlockStatus[] {
  return buckets.map(bucketToBlock)
}

const STATUS_COLOR: Record<string, string> = {
  up: '#4ADE80',
  down: '#F87171',
  unknown: '#FBBF24',
  maintenance: '#6BA3F7',
}

const STATUS_LABEL: Record<string, string> = {
  up: 'Operational',
  down: 'Down',
  unknown: 'Degraded',
  maintenance: 'Maintenance',
}

const OVERALL_COLOR: Record<string, string> = {
  operational: '#4ADE80',
  degraded: '#FBBF24',
  outage: '#F87171',
}

const OVERALL_LABEL: Record<string, string> = {
  operational: 'All Systems Operational',
  degraded: 'Partial Degradation',
  outage: 'Major Outage',
}

const INCIDENT_STATUS_COLOR: Record<string, string> = {
  investigating: '#F87171',
  monitoring: '#FBBF24',
  scheduled: '#6BA3F7',
  resolved: '#4ADE8066',
}

function HexIcon({ color }: Readonly<{ color: string }>) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer glow — slow breathe */}
      <Box
        sx={{
          position: 'absolute',
          width: 120, height: 120,
          borderRadius: '50%',
          bgcolor: `${color}`,
          filter: 'blur(40px)',
          opacity: 0,
          animation: 'hexGlow 3s ease-in-out infinite',
          '@keyframes hexGlow': {
            '0%, 100%': { opacity: 0.08 },
            '50%': { opacity: 0.28 },
          },
        }}
      />
      {/* Inner glow — same rhythm, tighter */}
      <Box
        sx={{
          position: 'absolute',
          width: 70, height: 70,
          borderRadius: '50%',
          bgcolor: `${color}`,
          filter: 'blur(18px)',
          opacity: 0,
          animation: 'hexGlowInner 3s ease-in-out infinite',
          '@keyframes hexGlowInner': {
            '0%, 100%': { opacity: 0.12 },
            '50%': { opacity: 0.4 },
          },
        }}
      />
      <svg width="80" height="88" viewBox="0 0 80 88" fill="none" style={{ position: 'relative' }}>
        <defs>
          <filter id="hex-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Hex fill — fades with glow */}
        <path
          d="M40 4L74 22V62L40 80L6 62V22L40 4Z"
          fill={`${color}0D`}
          style={{
            animation: 'hexFill 3s ease-in-out infinite',
          }}
        />
        <style>{`
          @keyframes hexFill {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
          @keyframes hexStroke {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
          @keyframes hexLine {
            0%, 100% { opacity: 0.6; filter: drop-shadow(0 0 2px ${color}); }
            50% { opacity: 1; filter: drop-shadow(0 0 6px ${color}); }
          }
        `}</style>
        {/* Hex border */}
        <path
          d="M40 4L74 22V62L40 80L6 62V22L40 4Z"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
          style={{ animation: 'hexStroke 3s ease-in-out infinite' }}
        />
        {/* EKG / heartbeat line */}
        <polyline
          points="12,46 22,46 27,36 31,54 35,38 39,52 43,44 48,44 53,34 57,54 61,44 68,44"
          stroke={color}
          strokeWidth="1.75"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ animation: 'hexLine 3s ease-in-out infinite' }}
        />
      </svg>
    </Box>
  )
}

function PulseDot({ color }: Readonly<{ color: string }>) {
  return (
    <Box sx={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
      <Box
        sx={{
          position: 'absolute', inset: 0, borderRadius: '50%', bgcolor: color,
          animation: color === '#F87171' ? 'pulse 1.5s ease-in-out infinite' : 'none',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1, transform: 'scale(1)' },
            '50%': { opacity: 0.4, transform: 'scale(1.5)' },
          },
        }}
      />
      <Box sx={{ position: 'absolute', inset: 0, borderRadius: '50%', bgcolor: color, opacity: 0.3 }} />
    </Box>
  )
}

function MonitorRow({ monitor }: Readonly<{ monitor: PublicMonitorRow }>) {
  const color = STATUS_COLOR[monitor.last_status] ?? '#94A3B8'
  const label = STATUS_LABEL[monitor.last_status] ?? monitor.last_status
  return (
    <Box sx={{ py: 1.75, borderBottom: '1px solid rgba(255,255,255,0.06)', '&:last-child': { borderBottom: 'none' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <PulseDot color={color} />
          <Typography fontSize="0.9rem" fontWeight={500} color="rgba(255,255,255,0.9)">
            {monitor.name}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            fontSize="0.8125rem"
            fontFamily="'IBM Plex Mono', monospace"
            color="rgba(255,255,255,0.35)"
          >
            {monitor.uptime_24h == null ? '—' : `${(monitor.uptime_24h * 100).toFixed(2)}%`}
          </Typography>
          <Typography
            fontSize="0.75rem"
            fontWeight={600}
            sx={{ color, minWidth: 80, textAlign: 'right' }}
          >
            {label}
          </Typography>
        </Box>
      </Box>
      {monitor.daily_buckets.length === 0 ? null : (
        <Box sx={{ pl: 2.75 }}>
          <UptimeBar blocks={toBlocks(monitor.daily_buckets)} />
        </Box>
      )}
    </Box>
  )
}

function timeAgoFromNow(now: number, isoStr: string): string {
  const diff = now - new Date(isoStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 60) return `${min}m ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function IncidentRow({ incident, isActive, now }: Readonly<{ incident: PublicIncident; isActive?: boolean; now: number }>) {
  const timeAgo = timeAgoFromNow(now, incident.started_at)

  const durationMin = incident.duration_s ? Math.round(incident.duration_s / 60) : null
  const statusKey = isActive ? 'investigating' : 'resolved'
  const dotColor = isActive ? '#F87171' : 'rgba(255,255,255,0.15)'
  const badgeColor = INCIDENT_STATUS_COLOR[statusKey]

  return (
    <Box
      sx={{
        display: 'flex', alignItems: 'flex-start', gap: 2, py: 1.5,
        borderBottom: '1px solid rgba(255,255,255,0.06)', '&:last-child': { borderBottom: 'none' },
        opacity: isActive ? 1 : 0.55,
      }}
    >
      <Box sx={{ position: 'relative', mt: 0.4, flexShrink: 0 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dotColor }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.25 }}>
          <Typography fontSize="0.9rem" fontWeight={600} color="rgba(255,255,255,0.9)" noWrap>
            {incident.monitor_name}
          </Typography>
          <Box
            sx={{
              fontSize: '0.625rem', fontWeight: 700, px: 1, py: 0.25, borderRadius: 0.5,
              bgcolor: `${badgeColor}22`, color: badgeColor, textTransform: 'uppercase',
              letterSpacing: '0.07em', flexShrink: 0, border: `1px solid ${badgeColor}44`,
            }}
          >
            {statusKey}
          </Box>
        </Box>
        <Typography fontSize="0.8125rem" color="rgba(255,255,255,0.6)" noWrap sx={{ mb: 0.25 }}>
          {incident.error_msg}
        </Typography>
        <Typography fontSize="0.75rem" fontFamily="'IBM Plex Mono', monospace" color="rgba(255,255,255,0.45)">
          {timeAgo}{durationMin ? ` · ${durationMin}m` : ''}
        </Typography>
      </Box>
    </Box>
  )
}

const PAGE_LOAD_TIME = Date.now()

export function PublicStatusPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isPending, isError } = usePublicStatusPage(slug ?? '')

  if (isPending) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#202232' }}>
        <CircularProgress role="progressbar" sx={{ color: '#F5A623' }} />
      </Box>
    )
  }

  if (isError || !data) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#202232', gap: 2 }}>
        <HexIcon color="#F87171" />
        <Typography color="rgba(255,255,255,0.4)" fontSize="0.875rem">Status page not found.</Typography>
      </Box>
    )
  }

  const accentColor = data.accent_color || '#F5A623'
  const overallColor = OVERALL_COLOR[data.overall_status] ?? accentColor
  const overallLabel = OVERALL_LABEL[data.overall_status] ?? data.overall_status
  const onlineCount = data.monitors.filter((m) => m.last_status === 'up').length
  const totalCount = data.monitors.length
  const nowTs = PAGE_LOAD_TIME
  const allIncidents = [
    ...data.active_incidents.map((i) => ({ ...i, isActive: true })),
    ...data.recent_incidents.map((i) => ({ ...i, isActive: false })),
  ]

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        bgcolor: '#202232',
        color: '#fff',
        fontFamily: '"Inter", sans-serif',
        overflow: 'hidden',
      }}
    >
      <HoneycombBg />
      {/* Top radial glow */}
      <Box sx={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 50% 0%, ${accentColor}12 0%, transparent 55%)`, pointerEvents: 'none' }} />
      {/* Header */}
      <Box sx={{ textAlign: 'center', pt: 7, pb: 5, px: 3 }}>
        {data.logo_url ? (
          <Box component="img" src={data.logo_url} alt="logo" sx={{ height: 56, mb: 2, mx: 'auto', display: 'block' }} />
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <HexIcon color={overallColor} />
          </Box>
        )}
        <Typography
          variant="h4"
          fontWeight={700}
          fontFamily="'Bricolage Grotesque', sans-serif"
          sx={{ color: overallColor, mb: 0.75, fontSize: { xs: '1.5rem', sm: '2rem' } }}
        >
          {overallLabel}
        </Typography>
        {totalCount > 0 && (
          <Typography
            fontSize="0.8125rem"
            fontFamily="'IBM Plex Mono', monospace"
            color="rgba(255,255,255,0.35)"
          >
            {onlineCount}/{totalCount} online
          </Typography>
        )}
        {data.description && (
          <Typography fontSize="0.9rem" color="rgba(255,255,255,0.45)" sx={{ mt: 1 }}>
            {data.description}
          </Typography>
        )}
      </Box>

      <Box sx={{ maxWidth: 680, mx: 'auto', px: { xs: 2, sm: 3 }, pb: 8 }}>

        {/* Incident Timeline */}
        {allIncidents.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              fontSize="0.6875rem" fontWeight={700} letterSpacing="0.1em"
              color="rgba(255,255,255,0.3)" textTransform="uppercase" sx={{ mb: 1.5 }}
            >
              Incident Timeline
            </Typography>
            <Box
              sx={{
                bgcolor: 'rgba(22,24,38,0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 2, px: 2.5,
              }}
            >
              {allIncidents.map((inc) => (
                <IncidentRow key={inc.id} incident={inc} isActive={inc.isActive} now={nowTs} />
              ))}
            </Box>
          </Box>
        )}

        {/* Monitors */}
        {data.monitors.length > 0 && (
          <Box>
            <Typography
              fontSize="0.6875rem" fontWeight={700} letterSpacing="0.1em"
              color="rgba(255,255,255,0.3)" textTransform="uppercase" sx={{ mb: 1.5 }}
            >
              Services
            </Typography>
            <Box
              sx={{
                bgcolor: 'rgba(22,24,38,0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 2, px: 2.5,
              }}
            >
              {data.monitors.map((m) => (
                <MonitorRow key={m.id} monitor={m} />
              ))}
            </Box>
          </Box>
        )}

        {data.monitors.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6, color: 'rgba(255,255,255,0.25)', fontSize: '0.875rem' }}>
            No monitors configured.
          </Box>
        )}

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography fontSize="0.75rem" color="rgba(255,255,255,0.2)">
            Powered by{' '}
            <Box component="span" sx={{ color: accentColor, fontWeight: 600 }}>
              HivePulse
            </Box>
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
