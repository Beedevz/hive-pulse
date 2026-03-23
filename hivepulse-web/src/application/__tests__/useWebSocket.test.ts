import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWebSocket } from '../useWebSocket'
import { createWrapper } from '../../test/utils'

// Mock wsClient
vi.mock('../../infrastructure/wsClient', () => ({
  wsClient: {
    connect: vi.fn(),
    subscribe: vi.fn(() => vi.fn()), // returns unsubscribe fn
  },
}))

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls subscribe when rendered', async () => {
    const { wsClient } = await import('../../infrastructure/wsClient')
    renderHook(() => useWebSocket(), { wrapper: createWrapper() })
    expect(wsClient.subscribe).toHaveBeenCalled()
  })
})
