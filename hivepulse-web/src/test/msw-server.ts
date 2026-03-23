import { setupServer } from 'msw/node'
import { monitorHandlers } from './handlers/monitors'
import { userHandlers } from './handlers/users'

export const server = setupServer(...monitorHandlers, ...userHandlers)
