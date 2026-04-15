import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { UptimeHeatmap } from '../UptimeHeatmap'
import type { StatsBucket } from '../../../domain/stats'

describe('UptimeHeatmap', () => {
  it('renders correct number of squares', () => {
    const buckets: StatsBucket[] = [
      { time: '2026-03-22T00:00:00Z', up_count: 10, total_count: 10, avg_ping_ms: 50 },
      { time: '2026-03-23T00:00:00Z', up_count: 5, total_count: 10, avg_ping_ms: 80 },
      { time: '2026-03-24T00:00:00Z', up_count: 0, total_count: 10, avg_ping_ms: 0 },
    ]
    const { getAllByTestId } = render(<UptimeHeatmap buckets={buckets} />)
    expect(getAllByTestId('heatmap-cell')).toHaveLength(3)
  })

  it('shows no data color for zero total_count', () => {
    const buckets: StatsBucket[] = [
      { time: '2026-03-24T00:00:00Z', up_count: 0, total_count: 0, avg_ping_ms: 0 },
    ]
    const { getByTestId } = render(<UptimeHeatmap buckets={buckets} />)
    const cell = getByTestId('heatmap-cell')
    expect(cell).toHaveStyle({ backgroundColor: '#9e9e9e' })
  })
})
