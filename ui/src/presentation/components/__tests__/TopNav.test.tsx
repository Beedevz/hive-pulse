import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../../../shared/ThemeProvider'
import { TopNav } from '../TopNav'

vi.mock('../../../application/useAuth', async (orig) => {
  const actual = await orig<typeof import('../../../application/useAuth')>()
  return { ...actual, useMe: () => ({ data: { email: 'admin@example.com', role: 'admin' } }) }
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <MemoryRouter initialEntries={['/dashboard']}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {children}
      </QueryClientProvider>
    </MemoryRouter>
  </ThemeProvider>
)

describe('TopNav', () => {
  it('renders Monitors, Alerts and Settings nav links', () => {
    render(<TopNav />, { wrapper })
    expect(screen.getByRole('link', { name: /monitors/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /alerts/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()
  })

  it('renders status pill with up count text', async () => {
    render(<TopNav />, { wrapper })
    // MSW mock monitor has last_status: 'unknown', so upCount=0 — pill shows "0 up"
    await waitFor(() => expect(screen.getByText('0 up')).toBeInTheDocument())
  })

  it('renders user avatar with first initial of email', () => {
    render(<TopNav />, { wrapper })
    expect(screen.getByText('A')).toBeInTheDocument()
  })
})
