import '@testing-library/jest-dom'
import { afterEach, beforeAll, afterAll } from 'vitest'
import { server } from './msw-server'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
