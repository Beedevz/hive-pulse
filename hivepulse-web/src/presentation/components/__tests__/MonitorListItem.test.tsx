import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../../../shared/ThemeProvider'
import { MonitorListItem } from '../MonitorListItem'
import type { Monitor } from '../../../domain/monitor'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

const baseMonitor: Monitor = {
  id: 'monitor-1',
  name: 'Test API',
  check_type: 'http',
  interval: 60,
  timeout: 30,
  retries: 0,
  retry_interval: 0,
  enabled: true,
  url: 'https://example.com',
  method: 'GET',
  expected_status: 200,
  last_status: 'up',
  uptime_24h: 0.998,
  created_at: '2026-03-22T00:00:00Z',
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {children}
      </QueryClientProvider>
    </MemoryRouter>
  </ThemeProvider>
)

describe('MonitorListItem', () => {
  it('renders monitor name', () => {
    render(<MonitorListItem monitor={baseMonitor} isSelected={false} />, { wrapper })
    expect(screen.getByText('Test API')).toBeInTheDocument()
  })

  it('renders uptime percentage', () => {
    render(<MonitorListItem monitor={baseMonitor} isSelected={false} />, { wrapper })
    expect(screen.getByText('99.8%')).toBeInTheDocument()
  })

  it('calls navigate to /monitors/:id on click', () => {
    render(<MonitorListItem monitor={baseMonitor} isSelected={false} />, { wrapper })
    fireEvent.click(screen.getByText('Test API'))
    expect(mockNavigate).toHaveBeenCalledWith('/monitors/monitor-1')
  })
})
