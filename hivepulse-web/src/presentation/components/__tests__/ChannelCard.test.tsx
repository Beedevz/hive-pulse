import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChannelCard } from '../ChannelCard'
import type { NotificationChannel } from '../../../domain/notification'
import { server } from '../../../test/msw-server'
import { http, HttpResponse } from 'msw'

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

const mockChannel: NotificationChannel = {
  id: 'ch-1',
  name: 'Ops Email',
  type: 'email',
  config: { to: 'ops@example.com' },
  is_global: true,
  enabled: true,
  remind_interval_min: 30,
  created_at: '2026-03-25T00:00:00Z',
}

describe('ChannelCard', () => {
  it('renders channel name and type', () => {
    renderWithQuery(<ChannelCard channel={mockChannel} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Ops Email')).toBeInTheDocument()
    expect(screen.getAllByText(/email/i).length).toBeGreaterThan(0)
  })

  it('shows Global badge when is_global is true', () => {
    renderWithQuery(<ChannelCard channel={mockChannel} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText(/global/i)).toBeInTheDocument()
  })

  it('calls onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn()
    renderWithQuery(<ChannelCard channel={mockChannel} onEdit={vi.fn()} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onDelete).toHaveBeenCalledWith('ch-1')
  })

  it('shows "— logs" placeholder before toggle is opened', () => {
    renderWithQuery(<ChannelCard channel={mockChannel} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('— logs')).toBeInTheDocument()
  })

  it('toggle button is present with aria-label "Logs"', () => {
    renderWithQuery(<ChannelCard channel={mockChannel} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByRole('button', { name: /logs/i })).toBeInTheDocument()
  })

  it('shows log rows after opening toggle', async () => {
    renderWithQuery(<ChannelCard channel={mockChannel} onEdit={vi.fn()} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /logs/i }))
    await waitFor(() => expect(screen.getByText('Test API')).toBeInTheDocument())
    expect(screen.getByText(/2h ago/i)).toBeInTheDocument()
  })

  it('shows "Deleted monitor" when monitor_name is empty', async () => {
    renderWithQuery(<ChannelCard channel={mockChannel} onEdit={vi.fn()} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /logs/i }))
    await waitFor(() => expect(screen.getByText('Deleted monitor')).toBeInTheDocument())
  })

  it('shows error message for failed log rows', async () => {
    renderWithQuery(<ChannelCard channel={mockChannel} onEdit={vi.fn()} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /logs/i }))
    await waitFor(() => expect(screen.getByText(/dial tcp: connection refused/i)).toBeInTheDocument())
  })

  it('shows "No notifications sent yet" for empty log list', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/notification-channels/:id/logs', () =>
        HttpResponse.json({ data: [] })
      )
    )
    const emptyChannel = { ...mockChannel, id: 'ch-empty' }
    renderWithQuery(<ChannelCard channel={emptyChannel} onEdit={vi.fn()} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /logs/i }))
    await waitFor(() =>
      expect(screen.getByText(/no notifications sent yet/i)).toBeInTheDocument()
    )
  })
})
