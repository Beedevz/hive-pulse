import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom'
import { ThemeProvider } from '../../../shared/ThemeProvider'
import { MonitorsPage } from '../MonitorsPage'
import type { DashboardOutletContext } from '../../components/DashboardLayout'

function ContextShell() {
  const ctx: DashboardOutletContext = { onEdit: vi.fn(), onDelete: vi.fn() }
  return <Outlet context={ctx} />
}

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
            <Route element={<ContextShell />}>
              <Route path="/monitor" element={<MonitorsPage />} />
              <Route path="/monitor/:id" element={<MonitorsPage />} />
            </Route>
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>
    </ThemeProvider>
  )
}

describe('MonitorsPage', () => {
  it('shows empty state when no monitor selected', () => {
    renderAt('/monitor')
    expect(screen.getByText(/select a monitor/i)).toBeInTheDocument()
  })

  it('renders MonitorDetailSection when :id present', async () => {
    renderAt('/monitor/monitor-1')
    // MonitorDetailSection shows Edit/Delete buttons for admin users
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    )
  })
})
