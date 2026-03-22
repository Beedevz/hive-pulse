package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	limiter "github.com/ulule/limiter/v3"
	mgin "github.com/ulule/limiter/v3/drivers/middleware/gin"
	"github.com/ulule/limiter/v3/drivers/store/memory"
)

func RateLimiter(rateStr string) gin.HandlerFunc {
	rate, _ := limiter.NewRateFromFormatted(rateStr) // e.g. "5-M"
	store := memory.NewStore()
	instance := limiter.New(store, rate)
	middleware := mgin.NewMiddleware(instance)
	return func(c *gin.Context) {
		middleware(c)
		if c.IsAborted() {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "too many requests"})
		}
	}
}
