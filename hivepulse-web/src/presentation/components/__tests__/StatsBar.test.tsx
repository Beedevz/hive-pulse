import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../../../shared/ThemeProvider'
import { StatsBar } from '../StatsBar'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
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

describe('StatsBar', () => {
  it('renders all 4 metric labels', () => {
    render(<StatsBar />, { wrapper })
    expect(screen.getByText(/avg uptime/i)).toBeInTheDocument()
    expect(screen.getByText(/monitors down/i)).toBeInTheDocument()
    expect(screen.getByText(/active incidents/i)).toBeInTheDocument()
    expect(screen.getByText(/total monitors/i)).toBeInTheDocument()
  })

  it('shows total monitors count from API', async () => {
    render(<StatsBar />, { wrapper })
    // MSW returns 1 monitor; Total Monitors cell should show "1"
    await waitFor(() =>
      expect(screen.getByTestId('total-monitors-value')).toHaveTextContent('1')
    )
  })

  it('navigates to /alerts when Active Incidents cell clicked', async () => {
    render(<StatsBar />, { wrapper })
    await waitFor(() => screen.getByTestId('incidents-cell'))
    fireEvent.click(screen.getByTestId('incidents-cell'))
    expect(mockNavigate).toHaveBeenCalledWith('/alerts')
  })
})
