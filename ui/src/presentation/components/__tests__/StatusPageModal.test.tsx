import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../../../shared/ThemeProvider'
import { StatusPageModal } from '../StatusPageModal'
import { useTags } from '../../../application/useTags'
import { useCreateStatusPage, useUpdateStatusPage } from '../../../application/useStatusPages'

vi.mock('../../../application/useTags')
vi.mock('../../../application/useStatusPages')

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {children}
      </QueryClientProvider>
    </MemoryRouter>
  </ThemeProvider>
)

describe('StatusPageModal', () => {
  beforeEach(() => {
    vi.mocked(useTags).mockReturnValue({ data: [{ id: 'tag-1', name: 'Production', color: '#4ADE80', created_at: '' }], isPending: false } as unknown as ReturnType<typeof useTags>)
    vi.mocked(useCreateStatusPage).mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useCreateStatusPage>)
    vi.mocked(useUpdateStatusPage).mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useUpdateStatusPage>)
  })

  it('renders title input', () => {
    render(<StatusPageModal open onClose={vi.fn()} />, { wrapper })
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
  })

  it('renders slug input', () => {
    render(<StatusPageModal open onClose={vi.fn()} />, { wrapper })
    expect(screen.getByLabelText(/slug/i)).toBeInTheDocument()
  })

  it('auto-fills slug from title', () => {
    render(<StatusPageModal open onClose={vi.fn()} />, { wrapper })
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Company' } })
    const slugInput = screen.getByLabelText(/slug/i) as HTMLInputElement
    expect(slugInput.value).toMatch(/^my-company-/)
  })

  it('shows preview link', () => {
    render(<StatusPageModal open onClose={vi.fn()} />, { wrapper })
    expect(screen.getByText(/preview/i)).toBeInTheDocument()
  })
})
