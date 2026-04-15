import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/msw-server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from '../LoginPage'
import { ThemeProvider } from '../../../shared/ThemeProvider'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  </MemoryRouter>
)

describe('LoginPage', () => {
  it('renders login form', () => {
    render(<LoginPage />, { wrapper })
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('shows error on invalid credentials', async () => {
    server.use(
      http.post('http://localhost:8080/api/v1/auth/login', () =>
        new HttpResponse(null, { status: 401 })
      )
    )
    render(<LoginPage />, { wrapper })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'bad@email.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument())
  })
})
