// hivepulse-web/src/presentation/components/__tests__/GeneralSettingsSection.test.tsx
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GeneralSettingsSection } from '../GeneralSettingsSection'

vi.mock('../../../application/useSettings', () => ({
  useGeneralSettings: vi.fn(() => ({ data: { timezone: 'Europe/Istanbul' } })),
  useSaveGeneralSettings: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}))

import { useGeneralSettings, useSaveGeneralSettings } from '../../../application/useSettings'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
)

describe('GeneralSettingsSection', () => {
  it('renders timezone select with current value', async () => {
    render(<GeneralSettingsSection />, { wrapper })
    await waitFor(() => {
      expect(screen.getByDisplayValue('Europe/Istanbul')).toBeInTheDocument()
    })
  })

  it('calls save mutation on Save button click', async () => {
    const mutate = vi.fn()
    vi.mocked(useSaveGeneralSettings).mockReturnValue({ mutate, isPending: false } as any)
    render(<GeneralSettingsSection />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(mutate).toHaveBeenCalledWith(
      { timezone: 'Europe/Istanbul' },
      expect.anything()
    ))
  })
})
