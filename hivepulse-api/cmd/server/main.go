// @title          HivePulse API
// @version        1.0
// @description    Open-source uptime monitoring platform
// @BasePath       /api/v1
// @securityDefinitions.apikey Bearer
// @in             header
// @name           Authorization
package main

import (
	"context"
	"fmt"
	"log"

	_ "github.com/beedevz/hivepulse/docs"
	"github.com/beedevz/hivepulse/infrastructure"
	"github.com/beedevz/hivepulse/internal/adapter/handler"
	"github.com/beedevz/hivepulse/internal/adapter/middleware"
	"github.com/beedevz/hivepulse/internal/adapter/repo"
	"github.com/beedevz/hivepulse/internal/adapter/service"
	"github.com/beedevz/hivepulse/internal/domain"
	infra "github.com/beedevz/hivepulse/internal/infrastructure"
	"github.com/beedevz/hivepulse/internal/port"
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

	monitorRepo := repo.NewMonitorRepo(db)
	heartbeatRepo := repo.NewHeartbeatRepo(db)

	hub := infra.NewHub()
	go hub.Run()

	checkerUC := usecase.NewCheckerUsecase(
		monitorRepo,
		heartbeatRepo,
		map[domain.CheckType]port.CheckerService{
			domain.CheckHTTP: service.NewHTTPChecker(),
			domain.CheckTCP:  service.NewTCPChecker(),
			domain.CheckPING: service.NewPINGChecker(),
			domain.CheckDNS:  service.NewDNSChecker(),
		},
		hub,
	)

	scheduler := infra.NewScheduler(checkerUC)
	scheduler.Start()

	ctx := context.Background()
	enabledMonitors, err := monitorRepo.FindAllEnabled(ctx)
	if err != nil {
		log.Printf("warning: could not load monitors for scheduler: %v", err)
	} else {
		for _, m := range enabledMonitors {
			scheduler.Add(m)
		}
	}

	monitorUC := usecase.NewMonitorUsecase(monitorRepo, scheduler)
	monitorHandler := handler.NewMonitorHandler(monitorUC, heartbeatRepo)

	userUC := usecase.NewUserUsecase(userRepo)
	userHandler := handler.NewUserHandler(userUC)

	wsHandler := handler.NewWSHandler(hub)

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

		jwtAuth := middleware.JWTAuth(cfg.JWTAccessSecret)
		editorGuard := middleware.RoleGuard(domain.RoleEditor, domain.RoleAdmin)
		adminGuard := middleware.RoleGuard(domain.RoleAdmin)

		monitors := v1.Group("/monitors")
		monitors.Use(jwtAuth)
		monitors.GET("", monitorHandler.List)
		monitors.GET("/:id", monitorHandler.Get)
		monitors.GET("/:id/heartbeats", monitorHandler.Heartbeats)
		monitors.POST("", editorGuard, monitorHandler.Create)
		monitors.PUT("/:id", editorGuard, monitorHandler.Update)
		monitors.DELETE("/:id", editorGuard, monitorHandler.Delete)

		users := v1.Group("/users")
		users.Use(jwtAuth, adminGuard)
		users.GET("", userHandler.ListUsers)
		users.PUT("/:id/role", userHandler.UpdateRole)
		users.DELETE("/:id", userHandler.DeleteUser)

		v1.GET("/ws", jwtAuth, wsHandler.Connect)
	}

	defer scheduler.Stop()

	addr := fmt.Sprintf(":%s", cfg.APIPort)
	log.Printf("HivePulse API starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
