import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ChannelModal } from '../ChannelModal'

describe('ChannelModal', () => {
  it('shows email To field when type is email', async () => {
    render(<ChannelModal open onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByLabelText('To')).toBeInTheDocument()
  })

  it('shows URL field when type is webhook', async () => {
    render(<ChannelModal open onClose={vi.fn()} onSubmit={vi.fn()} defaultType="webhook" />)
    expect(screen.getByLabelText(/url/i)).toBeInTheDocument()
  })

  it('calls onSubmit with form data when submitted', async () => {
    const onSubmit = vi.fn()
    render(<ChannelModal open onClose={vi.fn()} onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/name/i), 'My Channel')
    await userEvent.type(screen.getByLabelText('To'), 'ops@example.com')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onSubmit).toHaveBeenCalled()
  })
})
