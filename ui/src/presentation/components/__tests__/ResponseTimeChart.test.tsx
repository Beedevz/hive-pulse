import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '../../../shared/ThemeProvider'
import { ResponseTimeChart } from '../ResponseTimeChart'
import type { StatsBucket, DownPeriod } from '../../../domain/stats'

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
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  ReferenceArea: ({ fill }: { fill: string }) => <svg><rect data-testid="reference-area" fill={fill} /></svg>,
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  </ThemeProvider>
)

describe('ResponseTimeChart', () => {
  it('renders No data when buckets is empty', () => {
    render(<ResponseTimeChart buckets={[]} downPeriods={[]} range="24h" onRangeChange={vi.fn()} />, { wrapper })
    expect(screen.getByText('No data')).toBeTruthy()
  })

  it('renders chart when buckets provided', () => {
    const buckets: StatsBucket[] = [
      { time: '2026-03-24T00:00:00Z', up_count: 10, total_count: 10, avg_ping_ms: 45 },
      { time: '2026-03-24T01:00:00Z', up_count: 10, total_count: 10, avg_ping_ms: 60 },
    ]
    render(<ResponseTimeChart buckets={buckets} downPeriods={[]} range="24h" onRangeChange={vi.fn()} />, { wrapper })
    expect(screen.getByTestId('responsive-container')).toBeTruthy()
    expect(screen.getByTestId('line-chart')).toBeTruthy()
  })

  const mockDownPeriods: DownPeriod[] = [
    {
      started_at: new Date(Date.now() - 3_000_000).toISOString(),
      resolved_at: new Date(Date.now() - 2_700_000).toISOString(),
    },
  ]

  it('renders a Select with value "1h" by default', () => {
    render(
      <ThemeProvider>
        <QueryClientProvider client={new QueryClient()}>
          <ResponseTimeChart
            buckets={[]}
            downPeriods={[]}
            range="1h"
            onRangeChange={vi.fn()}
          />
        </QueryClientProvider>
      </ThemeProvider>
    )
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('calls onRangeChange when select value changes', async () => {
    const onRangeChange = vi.fn()
    render(
      <ThemeProvider>
        <QueryClientProvider client={new QueryClient()}>
          <ResponseTimeChart
            buckets={[]}
            downPeriods={[]}
            range="1h"
            onRangeChange={onRangeChange}
          />
        </QueryClientProvider>
      </ThemeProvider>
    )
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByRole('option', { name: '7d' }))
    expect(onRangeChange).toHaveBeenCalledWith('7d')
  })

  it('renders a ReferenceArea for each down period', () => {
    const { container } = render(
      <ThemeProvider>
        <QueryClientProvider client={new QueryClient()}>
          <ResponseTimeChart
            buckets={[
              { time: new Date(Date.now() - 3_600_000).toISOString(), up_count: 1, total_count: 1, avg_ping_ms: 40 },
            ]}
            downPeriods={mockDownPeriods}
            range="1h"
            onRangeChange={vi.fn()}
          />
        </QueryClientProvider>
      </ThemeProvider>
    )
    const redRects = container.querySelectorAll('[fill="rgba(248,113,113,0.35)"]')
    expect(redRects.length).toBeGreaterThanOrEqual(1)
  })

  it('renders ReferenceArea for active incident (no resolved_at)', () => {
    const activeIncident: DownPeriod = { started_at: new Date(Date.now() - 600_000).toISOString() }
    const { container } = render(
      <ThemeProvider>
        <QueryClientProvider client={new QueryClient()}>
          <ResponseTimeChart
            buckets={[
              { time: new Date(Date.now() - 3_600_000).toISOString(), up_count: 1, total_count: 1, avg_ping_ms: 40 },
            ]}
            downPeriods={[activeIncident]}
            range="1h"
            onRangeChange={vi.fn()}
          />
        </QueryClientProvider>
      </ThemeProvider>
    )
    const redRects = container.querySelectorAll('[fill="rgba(248,113,113,0.35)"]')
    expect(redRects.length).toBeGreaterThanOrEqual(1)
  })
})
