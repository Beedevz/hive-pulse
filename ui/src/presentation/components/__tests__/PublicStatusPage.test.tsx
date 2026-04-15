import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '../../../shared/ThemeProvider'
import { PublicStatusPage } from '../../pages/PublicStatusPage'
import { usePublicStatusPage } from '../../../application/useStatusPages'

vi.mock('../../../application/useStatusPages')

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={['/s/my-company-a3f2']}>
        <Routes>
          <Route path="/s/:slug" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  </ThemeProvider>
)

const mockData = {
  title: 'My Company Status', description: 'Real-time status',
  accent_color: '#F5A623', logo_url: null, overall_status: 'operational' as const,
  monitors: [{ id: 'm1', name: 'API Gateway', check_type: 'http', last_status: 'up' as const, uptime_24h: 0.998, uptime_90d: 0.994, daily_buckets: [] }],
  active_incidents: [],
  recent_incidents: [{ id: 'i1', monitor_name: 'API Gateway', started_at: '2026-03-20T10:00:00Z', resolved_at: '2026-03-20T10:05:00Z', duration_s: 300, error_msg: 'timeout' }],
}

describe('PublicStatusPage', () => {
  it('renders overall status label', () => {
    vi.mocked(usePublicStatusPage).mockReturnValue({ data: mockData, isPending: false, isError: false } as unknown as ReturnType<typeof usePublicStatusPage>)
    render(<PublicStatusPage />, { wrapper })
    expect(screen.getByText(/all systems operational/i)).toBeInTheDocument()
  })

  it('shows All Systems Operational banner', () => {
    vi.mocked(usePublicStatusPage).mockReturnValue({ data: mockData, isPending: false, isError: false } as unknown as ReturnType<typeof usePublicStatusPage>)
    render(<PublicStatusPage />, { wrapper })
    expect(screen.getByText(/all systems operational/i)).toBeInTheDocument()
  })

  it('shows monitor row', () => {
    vi.mocked(usePublicStatusPage).mockReturnValue({ data: mockData, isPending: false, isError: false } as unknown as ReturnType<typeof usePublicStatusPage>)
    render(<PublicStatusPage />, { wrapper })
    expect(screen.getAllByText('API Gateway').length).toBeGreaterThan(0)
  })

  it('shows incident timeline when active incidents exist', () => {
    const withIncident = { ...mockData, overall_status: 'outage' as const, active_incidents: [{ id: 'i2', monitor_name: 'DB', started_at: new Date().toISOString(), resolved_at: null, duration_s: 0, error_msg: 'down' }] }
    vi.mocked(usePublicStatusPage).mockReturnValue({ data: withIncident, isPending: false, isError: false } as unknown as ReturnType<typeof usePublicStatusPage>)
    render(<PublicStatusPage />, { wrapper })
    expect(screen.getByText(/incident timeline/i)).toBeInTheDocument()
  })

  it('shows incident timeline for recent incidents', () => {
    vi.mocked(usePublicStatusPage).mockReturnValue({ data: mockData, isPending: false, isError: false } as unknown as ReturnType<typeof usePublicStatusPage>)
    render(<PublicStatusPage />, { wrapper })
    expect(screen.getByText(/incident timeline/i)).toBeInTheDocument()
  })

  it('shows loading state', () => {
    vi.mocked(usePublicStatusPage).mockReturnValue({ data: undefined, isPending: true, isError: false } as unknown as ReturnType<typeof usePublicStatusPage>)
    render(<PublicStatusPage />, { wrapper })
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('shows 404 message on error', () => {
    vi.mocked(usePublicStatusPage).mockReturnValue({ data: undefined, isPending: false, isError: true } as unknown as ReturnType<typeof usePublicStatusPage>)
    render(<PublicStatusPage />, { wrapper })
    expect(screen.getByText(/not found/i)).toBeInTheDocument()
  })
})
