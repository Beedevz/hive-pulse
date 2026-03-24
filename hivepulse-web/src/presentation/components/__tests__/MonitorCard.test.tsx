// hivepulse-web/src/presentation/components/__tests__/MonitorCard.test.tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { MonitorCard } from '../MonitorCard'
import type { Monitor } from '../../../domain/monitor'

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
  follow_redirects: true,
  last_status: 'up',
  uptime_24h: 0.999,
  created_at: '2026-03-23T00:00:00Z',
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  </MemoryRouter>
)

describe('MonitorCard', () => {
  it('renders monitor name', () => {
    render(
      <MonitorCard monitor={baseMonitor} currentUserRole="admin" onEdit={vi.fn()} onDelete={vi.fn()} />,
      { wrapper }
    )
    expect(screen.getByText('Test API')).toBeInTheDocument()
  })

  it('shows uptime percentage', () => {
    render(
      <MonitorCard monitor={baseMonitor} currentUserRole="admin" onEdit={vi.fn()} onDelete={vi.fn()} />,
      { wrapper }
    )
    expect(screen.getByText(/99\.9%/)).toBeInTheDocument()
  })

  it('applies green border for up status', () => {
    const { container } = render(
      <MonitorCard monitor={baseMonitor} currentUserRole="admin" onEdit={vi.fn()} onDelete={vi.fn()} />,
      { wrapper }
    )
    const card = container.firstChild as HTMLElement
    expect(card.style.borderLeftColor).toBe('rgb(74, 222, 128)')
  })

  it('applies red border for down status', () => {
    const downMonitor = { ...baseMonitor, last_status: 'down' as const }
    const { container } = render(
      <MonitorCard monitor={downMonitor} currentUserRole="admin" onEdit={vi.fn()} onDelete={vi.fn()} />,
      { wrapper }
    )
    const card = container.firstChild as HTMLElement
    expect(card.style.borderLeftColor).toBe('rgb(248, 113, 113)')
  })

  it('hides edit/delete buttons for viewer role', () => {
    render(
      <MonitorCard monitor={baseMonitor} currentUserRole="viewer" onEdit={vi.fn()} onDelete={vi.fn()} />,
      { wrapper }
    )
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })

  it('shows edit/delete buttons for admin role', () => {
    render(
      <MonitorCard monitor={baseMonitor} currentUserRole="admin" onEdit={vi.fn()} onDelete={vi.fn()} />,
      { wrapper }
    )
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })
})
