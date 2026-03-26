import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../../../shared/ThemeProvider'
import { MonitorDetailSection } from '../MonitorDetailSection'

vi.mock('../../../application/useAuth', async (orig) => {
  const actual = await orig<typeof import('../../../application/useAuth')>()
  return { ...actual, useMe: vi.fn(() => ({ data: { email: 'admin@example.com', role: 'admin' } })) }
})

vi.mock('../../../application/useTags')

import { useMe } from '../../../application/useAuth'
import { useMonitorTags, useTags } from '../../../application/useTags'

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
  beforeEach(() => {
    vi.mocked(useMonitorTags).mockReturnValue({ data: [{ id: 'tag-1', name: 'Production', color: '#4ADE80', created_at: '' }], isPending: false } as unknown as ReturnType<typeof useMonitorTags>)
    vi.mocked(useTags).mockReturnValue({ data: [], isPending: false } as unknown as ReturnType<typeof useTags>)
  })

  it('renders monitor name from API', async () => {
    render(<MonitorDetailSection monitorId="monitor-1" />, { wrapper })
    await waitFor(() => expect(screen.getByText('Test API')).toBeInTheDocument())
  })

  it('calls onEdit when Edit button clicked', async () => {
    const onEdit = vi.fn()
    render(<MonitorDetailSection monitorId="monitor-1" onEdit={onEdit} />, { wrapper })
    await waitFor(() => screen.getByText('Test API'))
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'monitor-1', name: 'Test API' }))
  })

  it('calls onDelete when Delete confirmed', async () => {
    const onDelete = vi.fn()
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true)
    render(<MonitorDetailSection monitorId="monitor-1" onDelete={onDelete} />, { wrapper })
    await waitFor(() => screen.getByText('Test API'))
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onDelete).toHaveBeenCalledWith('monitor-1')
  })

  it('hides Edit/Delete buttons for viewer role', async () => {
    vi.mocked(useMe).mockReturnValue({ data: { email: 'viewer@example.com', role: 'viewer' } } as unknown as ReturnType<typeof useMe>)
    render(<MonitorDetailSection monitorId="monitor-1" />, { wrapper })
    await waitFor(() => screen.getByText('Test API'))
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })

  it('shows loading state before data arrives', () => {
    render(<MonitorDetailSection monitorId="monitor-1" />, { wrapper })
    expect(document.querySelector('.MuiCircularProgress-root')).toBeInTheDocument()
  })

  it('renders assigned tag chips', async () => {
    render(<MonitorDetailSection monitorId="monitor-1" />, { wrapper })
    await waitFor(() => expect(screen.getByText('Production')).toBeInTheDocument())
  })

  it('hides Add Tag button for viewer role', () => {
    vi.mocked(useMe).mockReturnValueOnce({ data: { email: 'v@test.com', role: 'viewer' } } as unknown as ReturnType<typeof useMe>)
    render(<MonitorDetailSection monitorId="monitor-1" />, { wrapper })
    expect(screen.queryByText(/\+ tag/i)).not.toBeInTheDocument()
  })
})
