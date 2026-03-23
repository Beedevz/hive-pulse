import type { HeartbeatEvent } from '../domain/monitor'

type HeartbeatHandler = (event: HeartbeatEvent) => void

class WSClient {
  private ws: WebSocket | null = null
  private handlers: Set<HeartbeatHandler> = new Set()
  private retryDelay = 1000
  private maxDelay = 30000
  private stopped = false

  connect(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN) return
    this.stopped = false

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    this.ws = new WebSocket(`${protocol}//${host}/api/v1/ws?token=${token}`)

    this.ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as HeartbeatEvent
        if (event.type === 'heartbeat') {
          this.handlers.forEach(h => h(event))
        }
      } catch { /* ignore malformed messages */ }
    }

    this.ws.onopen = () => {
      this.retryDelay = 1000 // reset backoff on successful connect
    }

    this.ws.onclose = () => {
      if (this.stopped) return
      setTimeout(() => this.connect(token), this.retryDelay)
      this.retryDelay = Math.min(this.retryDelay * 2, this.maxDelay)
    }
  }

  disconnect() {
    this.stopped = true
    this.ws?.close()
    this.ws = null
  }

  subscribe(handler: HeartbeatHandler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }
}

export const wsClient = new WSClient()
