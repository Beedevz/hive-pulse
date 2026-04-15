import { useTheme } from '@mui/material/styles'
import { colors } from '../../shared/colors'

export type BlockStatus = 'up' | 'down' | 'unknown'

interface UptimeBarProps {
  blocks: BlockStatus[]
}

export function UptimeBar({ blocks }: Readonly<UptimeBarProps>) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const colorMap: Record<BlockStatus, string> = {
    up:      isDark ? colors.up   : colors.upL,
    down:    isDark ? colors.down : colors.downL,
    unknown: isDark ? colors.darkTextTertiary : colors.lightTextTertiary,
  }

  const items = blocks.map((status, i) => ({ key: `b${i}`, status }))

  return (
    <div
      style={{
        display: 'flex',
        gap: 1.5,
        alignItems: 'stretch',
        height: '100%',
        width: '100%',
      }}
    >
      {items.map(({ key, status }) => (
        <div
          key={key}
          title={status}
          style={{
            flex: 1,
            height: '100%',
            backgroundColor: colorMap[status],
            borderRadius: 1.5,
            opacity: status === 'up' ? 0.4 : 1,
          }}
        />
      ))}
    </div>
  )
}
