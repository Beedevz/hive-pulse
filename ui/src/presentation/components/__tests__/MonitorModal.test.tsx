import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MonitorModal } from '../MonitorModal'

const noop = vi.fn()

describe('MonitorModal', () => {
  it('renders when open=true', () => {
    render(<MonitorModal open={true} onClose={noop} onSubmit={noop} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not render when open=false', () => {
    const { container } = render(<MonitorModal open={false} onClose={noop} onSubmit={noop} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows URL field when check_type is http (default)', () => {
    render(<MonitorModal open={true} onClose={noop} onSubmit={noop} />)
    expect(screen.getByLabelText(/url/i)).toBeInTheDocument()
  })

  it('shows Host and Port fields when check_type is tcp', () => {
    render(<MonitorModal open={true} onClose={noop} onSubmit={noop} />)
    const select = screen.getByLabelText(/check type/i)
    fireEvent.change(select, { target: { value: 'tcp' } })
    expect(screen.getByLabelText(/host/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/port/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/url/i)).not.toBeInTheDocument()
  })

  it('shows Ping Host field when check_type is ping', () => {
    render(<MonitorModal open={true} onClose={noop} onSubmit={noop} />)
    const select = screen.getByLabelText(/check type/i)
    fireEvent.change(select, { target: { value: 'ping' } })
    expect(screen.getByLabelText(/ping host/i)).toBeInTheDocument()
  })
})
