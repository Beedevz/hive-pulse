import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { MonitorSearch } from '../MonitorSearch'

describe('MonitorSearch', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders a search input', () => {
    render(<MonitorSearch onSearch={vi.fn()} />)
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })

  it('calls onSearch with typed value after debounce', async () => {
    vi.useFakeTimers()
    const onSearch = vi.fn()
    render(<MonitorSearch onSearch={onSearch} />)
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'api' } })
    expect(onSearch).not.toHaveBeenCalled()
    await act(async () => {
      vi.advanceTimersByTime(300)
    })
    expect(onSearch).toHaveBeenCalledWith('api')
  })

  it('calls onSearch with empty string when cleared', async () => {
    vi.useFakeTimers()
    const onSearch = vi.fn()
    render(<MonitorSearch onSearch={onSearch} />)
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'api' } })
    await act(async () => {
      vi.advanceTimersByTime(300)
    })
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: '' } })
    await act(async () => {
      vi.advanceTimersByTime(300)
    })
    expect(onSearch).toHaveBeenLastCalledWith('')
  })
})
