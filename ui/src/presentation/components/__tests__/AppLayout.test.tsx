import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '../../../shared/ThemeProvider'
import { AppLayout } from '../AppLayout'

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

describe('AppLayout', () => {
  it('renders TopNav with nav links', () => {
    render(
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<div>Dashboard Content</div>} />
        </Route>
      </Routes>,
      { wrapper }
    )
    expect(screen.getByRole('link', { name: /monitors/i })).toBeInTheDocument()
  })

  it('renders child route content via Outlet', () => {
    render(
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<div>Dashboard Content</div>} />
        </Route>
      </Routes>,
      { wrapper }
    )
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument()
  })
})
