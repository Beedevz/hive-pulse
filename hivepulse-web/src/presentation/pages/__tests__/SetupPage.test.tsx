import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/msw-server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { SetupPage } from '../SetupPage'
import { ThemeProvider } from '../../../shared/ThemeProvider'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: vi.fn() }
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  </MemoryRouter>
)

describe('SetupPage', () => {
  it('renders setup form', () => {
    render(<SetupPage />, { wrapper })
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('submits setup form and navigates to login', async () => {
    const mockNavigate = vi.fn()
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)

    server.use(
      http.post('http://localhost:8080/api/v1/auth/setup', () =>
        HttpResponse.json({ message: 'admin created' }, { status: 201 })
      )
    )

    render(<SetupPage />, { wrapper })
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Admin' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /create admin/i }))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'))
  })
})
