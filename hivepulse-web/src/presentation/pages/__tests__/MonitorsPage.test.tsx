import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '../../../shared/ThemeProvider'
import { MonitorsPage } from '../MonitorsPage'

vi.mock('react-router-dom', async (orig) => {
  const actual = await orig<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => vi.fn() }
})
vi.mock('../../../application/useAuth', async (orig) => {
  const actual = await orig<typeof import('../../../application/useAuth')>()
  return { ...actual, useMe: () => ({ data: { email: 'admin@example.com', role: 'admin' } }) }
})

function renderAt(path: string) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <Routes>
            <Route path="/dashboard" element={<MonitorsPage />} />
            <Route path="/monitors/:id" element={<MonitorsPage />} />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>
    </ThemeProvider>
  )
}

describe('MonitorsPage', () => {
  it('renders LeftPanel monitor list', async () => {
    renderAt('/dashboard')
    await waitFor(() => expect(screen.getByText('Test API')).toBeInTheDocument())
  })

  it('shows empty state when no monitor selected', () => {
    renderAt('/dashboard')
    expect(screen.getByText(/select a monitor/i)).toBeInTheDocument()
  })

  it('renders MonitorDetailSection when :id present', async () => {
    renderAt('/monitors/monitor-1')
    // MonitorDetailSection shows Edit/Delete buttons for admin users
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    )
  })
})
