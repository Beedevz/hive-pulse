package handler

import (
	"net/http"

	"github.com/beedevz/hivepulse/internal/infrastructure"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // CORS handled by Gin middleware
	},
}

type WSHandler struct {
	hub *infrastructure.Hub
}

func NewWSHandler(hub *infrastructure.Hub) *WSHandler {
	return &WSHandler{hub: hub}
}

// Connect godoc
// @Summary      WebSocket real-time heartbeat stream
// @Description  Connect via ws://host/api/v1/ws?token=<access_token>
// @Tags         ws
// @Security     Bearer
// @Router       /ws [get]
func (h *WSHandler) Connect(c *gin.Context) {
	userID, _ := c.Get("userID")

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	uid := ""
	if userID != nil {
		uid = userID.(string)
	}
	client := infrastructure.NewClient(h.hub, conn, uid)
	client.Register()

	go client.WritePump()
	go client.ReadPump()
}
