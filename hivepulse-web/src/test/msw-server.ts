import { setupServer } from 'msw/node'
import { monitorHandlers } from './handlers/monitors'
import { userHandlers } from './handlers/users'
import { notificationHandlers } from './handlers/notifications'
import { tagHandlers } from './handlers/tags'
import { statusPageHandlers } from './handlers/statusPages'
import { incidentHandlers } from './handlers/incidents'

export const server = setupServer(
  ...monitorHandlers,
  ...userHandlers,
  ...notificationHandlers,
  ...tagHandlers,
  ...statusPageHandlers,
  ...incidentHandlers,
)
