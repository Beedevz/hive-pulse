import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useChannels } from '../useNotifications'
import { createWrapper } from '../../test/utils'

describe('useChannels', () => {
  it('returns list of notification channels', async () => {
    const { result } = renderHook(() => useChannels(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].name).toBe('Ops Email')
  })
})
