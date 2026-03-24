import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ResponseTimeChart } from '../ResponseTimeChart'
import type { StatsBucket } from '../../../domain/stats'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
}))

describe('ResponseTimeChart', () => {
  it('renders No data when buckets is empty', () => {
    render(<ResponseTimeChart buckets={[]} range="24h" />)
    expect(screen.getByText('No data')).toBeTruthy()
  })

  it('renders chart when buckets provided', () => {
    const buckets: StatsBucket[] = [
      { time: '2026-03-24T00:00:00Z', up_count: 10, total_count: 10, avg_ping_ms: 45 },
      { time: '2026-03-24T01:00:00Z', up_count: 10, total_count: 10, avg_ping_ms: 60 },
    ]
    render(<ResponseTimeChart buckets={buckets} range="24h" />)
    expect(screen.getByTestId('responsive-container')).toBeTruthy()
    expect(screen.getByTestId('line-chart')).toBeTruthy()
  })
})
