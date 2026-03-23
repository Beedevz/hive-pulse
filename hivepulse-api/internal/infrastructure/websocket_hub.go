package infrastructure

import (
	"sync"

	"github.com/gorilla/websocket"
)

// testClient is a channel-backed client used only in tests (no real WS conn).
type testClient struct {
	send chan []byte
}

// Hub maintains connected WebSocket clients and broadcasts messages.
type Hub struct {
	clients      map[*Client]bool
	testClients  []*testClient
	broadcast    chan []byte
	register     chan *Client
	unregister   chan *Client
	registerTest chan *testClient
	mu           sync.Mutex
}

func NewHub() *Hub {
	return &Hub{
		clients:      make(map[*Client]bool),
		broadcast:    make(chan []byte, 256),
		register:     make(chan *Client),
		unregister:   make(chan *Client),
		registerTest: make(chan *testClient),
	}
}

// Run processes hub events — must be called in a goroutine.
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
		case tc := <-h.registerTest:
			h.mu.Lock()
			h.testClients = append(h.testClients, tc)
			h.mu.Unlock()
		case message := <-h.broadcast:
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mu.Lock()
			for _, tc := range h.testClients {
				select {
				case tc.send <- message:
				default:
				}
			}
			h.mu.Unlock()
		}
	}
}

// Broadcast implements port.WSBroadcaster. Non-blocking.
func (h *Hub) Broadcast(data []byte) {
	select {
	case h.broadcast <- data:
	default:
	}
}

// RegisterTestClient is used only in tests to receive broadcasts without a real WS connection.
func (h *Hub) RegisterTestClient(ch chan []byte) {
	h.registerTest <- &testClient{send: ch}
}

// Client is a single WebSocket connection.
type Client struct {
	hub    *Hub
	conn   *websocket.Conn
	send   chan []byte
	UserID string
}

func NewClient(hub *Hub, conn *websocket.Conn, userID string) *Client {
	return &Client{hub: hub, conn: conn, send: make(chan []byte, 256), UserID: userID}
}

func (c *Client) Register() { c.hub.register <- c }

func (c *Client) WritePump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	for msg := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			return
		}
	}
	_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
}

func (c *Client) ReadPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			return
		}
	}
}
