import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../../../shared/ThemeProvider'
import { MonitorDetailSection } from '../MonitorDetailSection'

vi.mock('../../../application/useAuth', async (orig) => {
  const actual = await orig<typeof import('../../../application/useAuth')>()
  return { ...actual, useMe: () => ({ data: { email: 'admin@example.com', role: 'admin' } }) }
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {children}
      </QueryClientProvider>
    </MemoryRouter>
  </ThemeProvider>
)

describe('MonitorDetailSection', () => {
  it('renders monitor name from API', async () => {
    render(<MonitorDetailSection monitorId="monitor-1" />, { wrapper })
    await waitFor(() => expect(screen.getByText('Test API')).toBeInTheDocument())
  })

  it('calls onEdit when Edit button clicked', async () => {
    const onEdit = vi.fn()
    render(<MonitorDetailSection monitorId="monitor-1" onEdit={onEdit} />, { wrapper })
    await waitFor(() => screen.getByText('Test API'))
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalled()
  })

  it('calls onDelete when Delete confirmed', async () => {
    const onDelete = vi.fn()
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true)
    render(<MonitorDetailSection monitorId="monitor-1" onDelete={onDelete} />, { wrapper })
    await waitFor(() => screen.getByText('Test API'))
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onDelete).toHaveBeenCalledWith('monitor-1')
  })
})
