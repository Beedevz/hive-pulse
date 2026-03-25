import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../../../shared/ThemeProvider'
import { StatsBar } from '../StatsBar'
import { useMonitors } from '../../../application/useMonitors'
import { useIncidents } from '../../../application/useIncidents'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})
vi.mock('../../../application/useMonitors')
vi.mock('../../../application/useIncidents')

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {children}
      </QueryClientProvider>
    </MemoryRouter>
  </ThemeProvider>
)

describe('StatsBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset handlers and provide default mocks
    vi.mocked(useMonitors).mockReturnValue({
      data: {
        data: [
          {
            id: 'monitor-1',
            name: 'Test API',
            check_type: 'http',
            interval: 60,
            timeout: 30,
            retries: 0,
            retry_interval: 20,
            enabled: true,
            url: 'https://example.com',
            method: 'GET',
            expected_status: 200,
            follow_redirects: true,
            last_status: 'unknown',
            uptime_24h: 0.95,
            created_at: '2026-03-22T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      },
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useMonitors>)
    vi.mocked(useIncidents).mockReturnValue({
      data: {
        data: [
          {
            id: 1,
            monitor_id: 'monitor-1',
            monitor_name: 'Test API',
            started_at: new Date(Date.now() - 120_000).toISOString(),
            resolved_at: null,
            duration_s: 120,
            error_msg: 'connection refused',
          },
        ],
        total: 1,
      },
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useIncidents>)
  })

  it('renders all 4 metric labels', () => {
    render(<StatsBar />, { wrapper })
    expect(screen.getByText(/avg uptime/i)).toBeInTheDocument()
    expect(screen.getByText(/monitors down/i)).toBeInTheDocument()
    expect(screen.getByText(/active incidents/i)).toBeInTheDocument()
    expect(screen.getByText(/total monitors/i)).toBeInTheDocument()
  })

  it('shows total monitors count from API', () => {
    render(<StatsBar />, { wrapper })
    expect(screen.getByTestId('total-monitors-value')).toHaveTextContent('1')
  })

  it('navigates to /alerts when Active Incidents cell clicked', () => {
    render(<StatsBar />, { wrapper })
    fireEvent.click(screen.getByTestId('incidents-cell'))
    expect(mockNavigate).toHaveBeenCalledWith('/alerts')
  })

  it('shows active incidents count from API', () => {
    render(<StatsBar />, { wrapper })
    expect(screen.getByTestId('incidents-value')).toHaveTextContent('1')
  })

  it('shows — for avg uptime when no monitors', () => {
    vi.mocked(useMonitors).mockReturnValueOnce({
      data: { data: [], total: 0, page: 1, limit: 1000 },
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useMonitors>)
    render(<StatsBar />, { wrapper })
    expect(screen.getByTestId('avg-uptime-value')).toHaveTextContent('—')
  })
})
