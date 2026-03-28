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
    expect(mockNavigate).toHaveBeenCalledWith('/monitor/monitor-1')
  })

  it('shows type chip for HTTP monitor', () => {
    render(<MonitorListItem monitor={baseMonitor} isSelected={false} />, { wrapper })
    expect(screen.getByText('HTTP')).toBeInTheDocument()
  })

  it('shows host:port sub-label for TCP monitor', () => {
    const tcpMonitor: Monitor = {
      ...baseMonitor,
      check_type: 'tcp',
      host: 'db.acme.com',
      port: 5432,
    }
    render(<MonitorListItem monitor={tcpMonitor} isSelected={false} />, { wrapper })
    expect(screen.getByText(/db\.acme\.com:5432/)).toBeInTheDocument()
    expect(screen.getByText('TCP')).toBeInTheDocument()
  })

  it('shows ping_host · Nx · interval for PING monitor', () => {
    const pingMonitor: Monitor = {
      ...baseMonitor,
      check_type: 'ping',
      ping_host: '10.0.0.5',
      packet_count: 4,
      interval: 60,
    }
    render(<MonitorListItem monitor={pingMonitor} isSelected={false} />, { wrapper })
    expect(screen.getByText(/10\.0\.0\.5 · 4x · 60s/)).toBeInTheDocument()
    expect(screen.getByText('PING')).toBeInTheDocument()
  })

  it('shows dns_host · record_type for DNS monitor', () => {
    const dnsMonitor: Monitor = {
      ...baseMonitor,
      check_type: 'dns',
      dns_host: 'cloudflare.com',
      record_type: 'A',
      interval: 60,
    }
    render(<MonitorListItem monitor={dnsMonitor} isSelected={false} />, { wrapper })
    expect(screen.getByText(/cloudflare\.com · A · 60s/)).toBeInTheDocument()
    expect(screen.getByText('DNS')).toBeInTheDocument()
  })
})
