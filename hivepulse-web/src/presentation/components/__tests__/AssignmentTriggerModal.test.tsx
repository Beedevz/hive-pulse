import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AssignmentTriggerModal } from '../AssignmentTriggerModal'
import type { MonitorChannelAssignment } from '../../../domain/notification'

vi.mock('../../../application/useNotifications')
vi.mock('../../../application/useSettings', () => ({
  useGeneralSettings: vi.fn(() => ({ data: { timezone: 'Europe/Istanbul' } })),
}))

import { useUpdateAssignmentTriggers } from '../../../application/useNotifications'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
)

const assignment: MonitorChannelAssignment = {
  id: 'ch-1',
  name: 'Ops Email',
  type: 'email',
  triggers: { cooldown_minutes: 0 },
}

describe('AssignmentTriggerModal', () => {
  it('renders channel name in header', () => {
    vi.mocked(useUpdateAssignmentTriggers).mockReturnValue({ mutate: vi.fn(), isPending: false } as any)
    render(
      <AssignmentTriggerModal assignment={assignment} monitorId="m1" open onClose={vi.fn()} />,
      { wrapper }
    )
    expect(screen.getByText(/Ops Email/)).toBeInTheDocument()
  })

  it('renders cooldown input', () => {
    vi.mocked(useUpdateAssignmentTriggers).mockReturnValue({ mutate: vi.fn(), isPending: false } as any)
    render(
      <AssignmentTriggerModal assignment={assignment} monitorId="m1" open onClose={vi.fn()} />,
      { wrapper }
    )
    expect(screen.getByLabelText(/cooldown/i)).toBeInTheDocument()
  })

  it('shows schedule fields when Custom is selected', () => {
    vi.mocked(useUpdateAssignmentTriggers).mockReturnValue({ mutate: vi.fn(), isPending: false } as any)
    render(
      <AssignmentTriggerModal assignment={assignment} monitorId="m1" open onClose={vi.fn()} />,
      { wrapper }
    )
    fireEvent.click(screen.getByLabelText(/custom/i))
    expect(screen.getByLabelText(/start/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/end/i)).toBeInTheDocument()
  })

  it('shows timezone from settings', () => {
    vi.mocked(useUpdateAssignmentTriggers).mockReturnValue({ mutate: vi.fn(), isPending: false } as any)
    render(
      <AssignmentTriggerModal assignment={assignment} monitorId="m1" open onClose={vi.fn()} />,
      { wrapper }
    )
    fireEvent.click(screen.getByLabelText(/custom/i))
    expect(screen.getByText(/Europe\/Istanbul/)).toBeInTheDocument()
  })

  it('calls mutation on Save', async () => {
    const mutate = vi.fn()
    vi.mocked(useUpdateAssignmentTriggers).mockReturnValue({ mutate, isPending: false } as any)
    render(
      <AssignmentTriggerModal assignment={assignment} monitorId="m1" open onClose={vi.fn()} />,
      { wrapper }
    )
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ channelId: 'ch-1' }),
      expect.anything()
    ))
  })
})
