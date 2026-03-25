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
        alignItems: 'flex-end',
        height: 20,
        width: '100%',
      }}
    >
      {items.map(({ key, status }) => (
        <div
          key={key}
          title={status}
          style={{
            flex: 1,
            height: status === 'up' ? 20 : 14,
            backgroundColor: colorMap[status],
            borderRadius: 1.5,
            // UP blocks are muted via opacity (matches mockup: opacity:.4 for up, 1 for others)
            opacity: status === 'up' ? 0.4 : 1,
          }}
        />
      ))}
    </div>
  )
}
