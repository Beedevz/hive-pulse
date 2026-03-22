// @title          HivePulse API
// @version        1.0
// @description    Open-source uptime monitoring platform
// @BasePath       /api/v1
// @securityDefinitions.apikey Bearer
// @in             header
// @name           Authorization
package main

import (
	"fmt"
	"log"

	_ "github.com/beedevz/hivepulse/docs"
	"github.com/beedevz/hivepulse/infrastructure"
	"github.com/beedevz/hivepulse/internal/adapter/handler"
	"github.com/beedevz/hivepulse/internal/adapter/middleware"
	"github.com/beedevz/hivepulse/internal/adapter/repo"
	"github.com/beedevz/hivepulse/internal/usecase"
	"github.com/gin-gonic/gin"
	swaggerfiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	cfg := infrastructure.LoadConfig()
	infrastructure.RunMigrations(cfg.DatabaseURL)
	db := infrastructure.NewDatabase(cfg.DatabaseURL)

	userRepo := repo.NewUserRepo(db)
	tokenRepo := repo.NewTokenRepo(db)
	authUC := usecase.NewAuthUsecase(
		userRepo, tokenRepo,
		cfg.JWTAccessSecret, cfg.JWTRefreshSecret,
		cfg.JWTAccessExpiry, cfg.JWTRefreshExpiry,
	)
	authHandler := handler.NewAuthHandler(authUC, cfg.JWTRefreshExpiry)

	r := gin.Default()
	r.Use(middleware.CORS(cfg.CORSAllowedOrigins))

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerfiles.Handler))

	v1 := r.Group("/api/v1")
	{
		auth := v1.Group("/auth")
		auth.GET("/setup/status", authHandler.SetupStatus)
		auth.POST("/setup", authHandler.Setup)
		auth.POST("/login", middleware.RateLimiter("5-M"), authHandler.Login)
		auth.POST("/refresh", authHandler.Refresh)

		protected := auth.Group("")
		protected.Use(middleware.JWTAuth(cfg.JWTAccessSecret))
		protected.POST("/logout", authHandler.Logout)
		protected.GET("/me", authHandler.Me)
	}

	addr := fmt.Sprintf(":%s", cfg.APIPort)
	log.Printf("HivePulse API starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
