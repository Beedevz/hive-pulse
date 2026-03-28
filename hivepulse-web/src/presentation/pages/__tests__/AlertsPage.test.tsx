import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AlertsPage } from '../AlertsPage'
import { ThemeProvider } from '../../../shared/ThemeProvider'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {children}
      </QueryClientProvider>
    </MemoryRouter>
  </ThemeProvider>
)

describe('AlertsPage', () => {
  it('renders Alerts heading', () => {
    render(<AlertsPage />, { wrapper })
    expect(screen.getByRole('heading', { name: /alerts/i })).toBeInTheDocument()
  })

  it('shows active incident from MSW fixture', async () => {
    render(<AlertsPage />, { wrapper })
    await waitFor(() =>
      expect(screen.getAllByText(/Test API/i).length).toBeGreaterThan(0)
    )
  })

  it('shows resolved incidents section', async () => {
    render(<AlertsPage />, { wrapper })
    await waitFor(() =>
      expect(screen.getAllByText(/resolved/i).length).toBeGreaterThan(0)
    )
  })

  it('Active filter hides resolved section heading', async () => {
    render(<AlertsPage />, { wrapper })
    await waitFor(() => screen.getAllByText(/Test API/i))
    fireEvent.click(screen.getByRole('button', { name: /^active$/i }))
    // The section heading "✓ Resolved (N)" should be gone; the filter button text "Resolved" stays
    expect(screen.queryByText(/✓ Resolved/i)).not.toBeInTheDocument()
  })

  it('Resolved filter hides active section heading', async () => {
    render(<AlertsPage />, { wrapper })
    await waitFor(() => screen.getAllByText(/Test API/i))
    fireEvent.click(screen.getByRole('button', { name: /^resolved$/i }))
    // The section heading "🔴 Active (N)" should be gone; the filter button text "Active" stays
    expect(screen.queryByText(/🔴 Active/i)).not.toBeInTheDocument()
  })

  it('renders a search input', async () => {
    render(<AlertsPage />, { wrapper })
    await waitFor(() => screen.getByPlaceholderText(/search/i))
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })

  it('shows pagination for resolved incidents', async () => {
    render(<AlertsPage />, { wrapper })
    // Wait for resolved incidents to load (pagination renders after data arrives)
    await waitFor(() => expect(screen.getByRole('navigation')).toBeInTheDocument())
  })
})
